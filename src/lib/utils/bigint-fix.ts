export function setupBigIntSerialization() {
  if (!(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };
  }
}
