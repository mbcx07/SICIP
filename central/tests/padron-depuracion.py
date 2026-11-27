"""Synthetic roster identity and preservation regression checks; no network."""
import copy,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('depurar',Path(__file__).parents[1]/'scripts/depurar-padron.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def person(mid,**extra):return {'matricula':mid,'nombre':'PEREZ/PRUEBA/JUAN','privado':{'curp':'PEPJ800101HBSRRN09','rfc':'PEPJ800101AAA','nss':'12345678901'},**extra}
class Depuracion(unittest.TestCase):
 def fixture(self):return {'personas':[person('ACTIVO'),person('ANTERIOR'),person('HOMONIMO',privado={}),person('MANDO',nomina_origen='MANDO_FEDERAL'),person('TITULAR')],'plazas':[{'ocupante_matricula':'ACTIVO','titular_matricula':'TITULAR'}],'antiguedad':[],'counts':{'personas':5,'plazas':1}}
 def test_prioridad_y_conservacion(self):
  s=self.fixture();before=copy.deepcopy(s);result,report=m.depurar(s);self.assertEqual(s,before);self.assertEqual([r['anterior'] for r in report['confirmados']],['ANTERIOR']);self.assertEqual({p['matricula'] for p in result['personas']},{'ACTIVO','HOMONIMO','MANDO','TITULAR'});again,r=m.depurar(result);self.assertEqual(again,result);self.assertFalse(r['confirmados'])
 def test_no_fusiona_nombres_o_dos_identidades_activas(self):
  s=self.fixture();s['personas'].append(person('OTRO_ACTIVO'));s['plazas'].append({'ocupante_matricula':'OTRO_ACTIVO'});r,report=m.depurar(s);self.assertEqual(len(r['personas']),6);self.assertTrue(report['pendientes']);self.assertFalse(report['confirmados'])
 def test_identificadores_conflictivos_sin_evidencia_suficiente_se_conservan(self):
  s=self.fixture();s['personas'][1]['privado']={'rfc':'PEPJ800101AAA','curp':'PEPJ810101HBSRRN09','nss':'12345678902'};r,report=m.depurar(s);self.assertEqual(len(r['personas']),5);self.assertFalse(report['confirmados']);self.assertEqual(report['pendientes'][0]['anterior'],'ANTERIOR')
if __name__=='__main__':unittest.main()
