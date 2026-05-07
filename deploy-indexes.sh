#!/bin/bash
# Script para desplegar índices de Firestore
# Creado por Noty 🔥
# Uso: bash deploy-indexes.sh

echo "=== Desplegando índices de Firestore para SICIP ==="
echo ""
echo "Paso 1: Autentícate en Firebase"
echo "  npx firebase-tools login"
echo ""

read -p "¿Ya iniciaste sesión en firebase-tools? (s/n): " logged_in

if [ "$logged_in" != "s" ]; then
  echo "Corre: npx firebase-tools login"
  echo "Después vuelve a ejecutar este script."
  exit 1
fi

cd "$(dirname "$0")"

echo ""
echo "Paso 2: Desplegando índices..."
echo ""
npx firebase-tools deploy --only firestore:indexes

echo ""
echo "=== Listo! ==="
echo "Los índices están siendo creados en Firestore."
echo "Tarda 1-2 minutos en propagarse."
