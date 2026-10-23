#!/usr/bin/env python3
"""Extract only historical, nonpersonal vacation rules. Never execute VBA.
Usage: python3 central/scripts/analyze-vacaciones.py workbook.xlsm output.json
Uses OOXML cached values; does not evaluate or endorse historical formulas.
"""
import hashlib
import json
import posixpath
import sys
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

def analyze(path):
    with ZipFile(path) as z:
        strings = [''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        rels = {e.attrib['Id']: posixpath.normpath('xl/' + e.attrib['Target']) for e in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        inventory = []
        for s in ET.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet', NS):
            target = rels[s.attrib['{' + REL + '}id']]
            root = ET.fromstring(z.read(target))
            cells = {}
            for c in root.findall('m:sheetData/m:row/m:c', NS):
                val = c.findtext('m:v', namespaces=NS)
                if c.attrib.get('t') == 's' and val is not None:
                    val = strings[int(val)]
                elif c.attrib.get('t') not in ('e', 'str') and val is not None:
                    try:
                        val = float(val)
                        if val.is_integer(): val = int(val)
                    except ValueError:
                        pass
                cells[c.attrib['r']] = {'value': val, 'formula': c.findtext('m:f', namespaces=NS), 'type': c.attrib.get('t')}
            sheets[s.attrib['name']] = cells
            inventory.append({'name': s.attrib['name'], 'visibility': s.attrib.get('state', 'visible'), 'kind': 'chart' if '/chartsheets/' in target else 'worksheet', 'cached_errors': dict(Counter(c['value'] for c in cells.values() if c['type'] == 'e'))})
        def v(sheet, cell): return sheets[sheet].get(cell, {}).get('value')
        def f(sheet, cell): return sheets[sheet].get(cell, {}).get('formula')
        rules = 'CAPTURA ROL VACACIONAL'
        columns = ['V','W','X','Y','Z','AA','AB','AE','AF','AG','AH','AI','AJ','AK','AL']
        rights = [{'source_row': row, 'periodo': v(rules, f'U{row}'), 'values': {col: v(rules, f'{col}{row}') for col in columns}} for row in range(10,110)]
        equivalences = [{'dias': v('DIF X DESC',f'G{row}'), 'noches': v('DIF X DESC',f'H{row}'), 'acumuladas': v('DIF X DESC',f'I{row}'), 'source_row': row, 'noches_formula': f('DIF X DESC',f'H{row}')} for row in range(34,49)]
        rests = [{'label': v('DIF X DESC',f'A{row}'), 'excel_rest_codes': [v('DIF X DESC',f'{col}{row}') for col in 'BCDEF' if v('DIF X DESC',f'{col}{row}') is not None]} for row in range(50,77)]
        return {'source': {'file': Path(path).name, 'sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest(), 'status': 'HISTORICO_NO_VALIDADO', 'macros_executed': False, 'personal_records_exported': False}, 'sheets': inventory, 'marks': [v(rules,f'E{row}') for row in range(32,40)], 'rights_columns': {col: v(rules,f'{col}9') for col in columns}, 'rights': rights, 'equivalences': equivalences, 'rest_codes_historical': rests, 'critical_formulas': {sheet: {cell: f(sheet,cell) for cell in cells} for sheet,cells in {rules:['U5','U6','U7','U8','W6','W7','W8','J36','J37','J38','H7'], 'DIF X DESC':['D3','E3','E2','F2','H35'], 'CAPTURA PECV':['M7']}.items()}}

if __name__ == '__main__':
    result = analyze(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sheets':len(result['sheets']),'rights_rows':len(result['rights']),'equivalence_rows':len(result['equivalences']),'status':result['source']['status']}))
