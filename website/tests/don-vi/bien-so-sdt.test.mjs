import { test } from "node:test";
import assert from "node:assert/strict";
import { chuanHoaBienSo, khoaBienSo } from "../../lib/bien-so.mjs";
import { chuanHoaSdt, cheSdt } from "../../lib/so-dien-thoai.mjs";

test("biển số gõ liền, có dấu, chữ thường đều ra cùng một dạng", () => {
  for (const v of ["30a12345", "30A-123.45", "30A 123 45", "30a-12345", " 30A.123.45 "]) assert.equal(chuanHoaBienSo(v), "30A-123.45");
  assert.equal(chuanHoaBienSo("30A1234"), "30A-1234");
  assert.equal(chuanHoaBienSo("30ld12345"), "30LD-123.45");
  assert.equal(chuanHoaBienSo("51F-678.90"), "51F-678.90");
  assert.equal(chuanHoaBienSo("29đ12345"), "29D-123.45");
});

test("biển số sai thì trả null", () => {
  for (const v of ["", "abc", "30A123", "05A12345", "30A1234567", "3A12345", null, undefined]) assert.equal(chuanHoaBienSo(v), null);
  assert.equal(khoaBienSo("30A-123.45"), "30A12345");
});

test("số điện thoại: chuẩn hoá 0xxxxxxxxx, nhận +84 và 84", () => {
  assert.equal(chuanHoaSdt("0912 345 678"), "0912345678");
  assert.equal(chuanHoaSdt("+84912345678"), "0912345678");
  assert.equal(chuanHoaSdt("84912345678"), "0912345678");
  assert.equal(chuanHoaSdt("0912.345.678"), "0912345678");
  for (const v of ["123", "0212345678", "091234567", "09123456789", ""]) assert.equal(chuanHoaSdt(v), null);
});

test("che số điện thoại trên link công khai", () => {
  assert.equal(cheSdt("0912345678"), "0912 xxx 678");
  assert.equal(cheSdt("+84912345345"), "0912 xxx 345");
});
