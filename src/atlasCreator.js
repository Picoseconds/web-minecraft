
  var AtlasCreator, Canvas, fs, path;

  path = require("path");

  fs = require("fs");

  Canvas = require("canvas");

  AtlasCreator = class AtlasCreator {
    constructor(options) {
      this.pref = options.pref;
      this.oneFrame = options.oneFrame;
      this.toxelSize = options.toxelSize;
      this.loadPath = options.loadPath;
      this.buildPath = options.buildPath;
      this.atlasSize = options.atlasSize;
      this.canvas = Canvas.createCanvas(this.atlasSize * this.toxelSize, this.atlasSize * this.toxelSize);
      this.ctx = this.canvas.getContext('2d');
      this.toxelX = 1;
      this.toxelY = 1;
      this.loadedImages = 0;
      this.images = {};
      this.textureMapping = {};
      this.emptyDir();
      this.firstLoad();
      return;
    }

    emptyDir() {
      if (!fs.existsSync(this.buildPath)) {
        fs.mkdirSync(this.buildPath);
      }
    }

    firstLoad() {
      var _this;
      _this = this;
      fs.readdir(this.loadPath, function(err, files) {
        var totalImages;
        totalImages = 0;
        files.forEach(function(file) {
          var filePath;
          filePath = `${_this.loadPath}/${file}`;
          if (path.extname(file) === ".png") {
            totalImages += 1;
          }
        });
        _this.totalImages = totalImages;
        files.forEach(function(file) {
          var filePath;
          filePath = `${_this.loadPath}/${file}`;
          if (path.extname(file) === ".png") {
            // console.log filePath
            _this.addImageToLoad(filePath, file);
          }
        });
      });
    }

    addImageToLoad(filePath, name) {
      var _this, img;
      _this = this;
      img = new Canvas.Image();
      img.onload = function() {
        _this.images[name] = img;
        _this.loadedImages++;
        if (_this.loadedImages === _this.totalImages) {
          return _this.forEachToxel();
        }
      };
      img.src = filePath;
    }

    forEachToxel() {
      var _this;
      _this = this;
      Object.keys(this.images).forEach(function(name) {
        var img;
        img = _this.images[name];
        _this.addToxelToAtlas(img, name);
      });
      return this.updateAtlas();
    }

    addToxelToAtlas(img, name) {
      var h, i, j, k, l, ref, ref1, w;
      w = img.width / this.toxelSize;
      h = img.height / this.toxelSize;
      if (this.oneFrame) {
        this.ctx.drawImage(img, 0, 0, this.toxelSize, this.toxelSize, (this.toxelX - 1) * this.toxelSize, (this.toxelY - 1) * this.toxelSize, this.toxelSize, this.toxelSize);
        this.textureMapping[`${name.substr(0, name.length - 4)}`] = {
          x: this.toxelX,
          y: this.toxelY
        };
        this.moveToxel();
      } else {
        if (w > 1 || h > 1) {
          for (i = k = 0, ref = w - 1; (0 <= ref ? k <= ref : k >= ref); i = 0 <= ref ? ++k : --k) {
            for (j = l = 0, ref1 = h - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); j = 0 <= ref1 ? ++l : --l) {
              this.ctx.drawImage(img, i * this.toxelSize, j * this.toxelSize, this.toxelSize, this.toxelSize, (this.toxelX - 1) * this.toxelSize, (this.toxelY - 1) * this.toxelSize, this.toxelSize, this.toxelSize);
              this.textureMapping[`${name.substr(0, name.length - 4)}@${i}@${j}`] = {
                x: this.toxelX,
                y: this.toxelY
              };
              this.moveToxel();
            }
          }
        } else {
          this.ctx.drawImage(img, (this.toxelX - 1) * this.toxelSize, (this.toxelY - 1) * this.toxelSize, this.toxelSize, this.toxelSize);
          this.textureMapping[name.substr(0, name.length - 4)] = {
            x: this.toxelX,
            y: this.toxelY
          };
          this.moveToxel();
        }
      }
    }

    moveToxel() {
      if (this.toxelX === this.atlasSize) {
        this.toxelX = 1;
        this.toxelY += 1;
      } else {
        this.toxelX += 1;
      }
    }

    updateAtlas(path) {
      console.log(`\x1b[33m[${this.pref} Atlas]`);
      console.log(`\x1b[32mTotal images: ${this.totalImages}`);
      fs.writeFileSync(`${this.buildPath}/${this.pref}-Atlas.png`, this.canvas.toBuffer('image/png'));
      console.log(`\x1b[33mFull atlas: ${this.buildPath}/${this.pref}-Atlas.png`);
      fs.writeFileSync(`${this.buildPath}/${this.pref}-Mapping.json`, JSON.stringify(this.textureMapping, null, 2));
      console.log(`\x1b[33mFull atlas mapping: ${this.buildPath}/${this.pref}-Mapping.json`);
      console.log(`\x1b[32mSuccessfully generated ${this.canvas.width}x${this.canvas.height} Texture Atlas!\n\x1b[0m`);
    }

  };

  module.exports = AtlasCreator;
