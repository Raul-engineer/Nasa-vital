import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarLectura, TEXTO_SENSOR, validarCampo, validarLectura } from "../validar.js";
import { evaluarAlarmas } from "../alarma.js";

test("FC 0, SpO₂ 104 y PA 80/95 → Revisa el sensor, sin alarma médica", () => {
  for (const l of [{ fc: 0 }, { spo2: 104 }, { sistolica: 80, diastolica: 95 }]) {
    const v = validarLectura(l);
    assert.equal(v.ok, false);
    assert.ok(v.errores[0].texto.startsWith(TEXTO_SENSOR));
    assert.deepEqual(evaluarAlarmas({ astronauta: { id: 1, nombre: "Reyes", lectura: l, news2: 0 } }), []);
  }
});

test("Valores posibles pasan", () => {
  assert.equal(validarLectura({ fc: 72, spo2: 97, sistolica: 118, diastolica: 76, temperatura: 36.8, frec_resp: 14 }).ok, true);
});

test("limpiarLectura quita solo los campos imposibles", () => {
  const r = limpiarLectura({ fc: 300, spo2: 96 });
  assert.equal(r.lectura.fc, undefined);
  assert.equal(r.lectura.spo2, 96);
  assert.equal(r.errores.length, 1);
});

test("Rangos de campos escritos a mano", () => {
  assert.equal(validarCampo("kss", 10), "Debe estar entre 1 y 9.");
  assert.equal(validarCampo("borg", 11), "Debe estar entre 0 y 10.");
  assert.equal(validarCampo("dolor", -1), "Debe estar entre 0 y 10.");
  assert.equal(validarCampo("horas", 25), "Debe estar entre 0 y 24.");
  assert.equal(validarCampo("kss", ""), "Falta este dato.");
  assert.equal(validarCampo("kss", 5), null);
  assert.equal(validarLectura({ pvt: 80 }).ok, false);
});
