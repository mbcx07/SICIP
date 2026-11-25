"""Compatibility entry point for the annual-history browser regression."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('historial-anual-browser.py')),run_name='__main__')
