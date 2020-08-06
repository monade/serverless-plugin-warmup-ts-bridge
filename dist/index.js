'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const path = require('path');
const modulePath = path.join(__dirname, '../..');
const fs = require(path.join(modulePath, 'fs-extra'));
const defaultDir = '_warmup';
const opts = {
  warmupDir: defaultDir,
  buildFolder: '.build'
};
modify(
  'serverless-plugin-typescript',
  Class =>
    class extends Class {
      constructor(...args) {
        super(...args);
        this.beforeArtifacts = () =>
          __awaiter(this, void 0, void 0, function*() {
            yield this.compileTs();
            yield this.copyExtras();
            yield this.copyDependencies(true);
            const target = path.resolve(this.serverless.config.servicePath, opts.warmupDir);
            const warmUpDirectory = path.resolve(this.originalServicePath, opts.warmupDir);
            if (!fs.existsSync(warmUpDirectory)) fs.mkdirSync(warmUpDirectory);
            if (!fs.existsSync(target)) fs.symlinkSync(warmUpDirectory, target);
          });
        this.afterArtifacts = () =>
          __awaiter(this, void 0, void 0, function*() {
            yield this.moveArtifacts();
            // Restore service path
            this.serverless.config.servicePath = this.originalServicePath;
          });
        this.finalize = () =>
          __awaiter(this, void 0, void 0, function*() {
            return fs.removeSync(path.resolve(this.originalServicePath, opts.buildFolder));
          });
        this.hooks = Object.assign({}, this.hooks, {
          'before:package:createDeploymentArtifacts': this.beforeArtifacts,
          'after:package:createDeploymentArtifacts': this.afterArtifacts,
          'deploy:finalize': this.finalize
        });
      }
      get rootFileNames() {
        return super.rootFileNames.filter(filepath => fs.existsSync(path.resolve(this.originalServicePath, filepath)));
      }
    }
);
function modify(dependency, handler) {
  const filepath = path.join(modulePath, dependency);
  const Class = require(filepath);
  const re = new RegExp(dependency);
  const cachePath = Object.keys(require.cache).find(p => re.test(p));
  require.cache[cachePath].exports = handler(Class);
}
module.exports = class {
  constructor(serverless) {
    const config = (serverless.service.custom && serverless.service.custom.warmup) || {};
    opts.warmupDir = config.folderName || defaultDir;
  }
};
//# sourceMappingURL=index.js.map
