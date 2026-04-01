class PDFDocumentShim {
  constructor(opts = {}) {
    this.opts = opts;
    this._res = null;
  }

  pipe(res) {
    this._res = res;
    return this;
  }

  fontSize() {
    return this;
  }

  moveDown() {
    return this;
  }

  fillColor() {
    return this;
  }

  text(str, opts) {
    if (this._res && typeof this._res.write === 'function') {
      this._res.write(String(str) + '\n');
    }
    return this;
  }

  end() {
    if (this._res && typeof this._res.end === 'function') {
      this._res.end();
    }
    return this;
  }
}

export default PDFDocumentShim;
