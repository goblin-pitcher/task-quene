const typeEnum = Object.freeze({
  PENDING: "pending",
  FULFILLED: "fulfilled",
});
const statusMark = Symbol("status");
// 获取数组的第一个或最后一个，获取方式有两种，一种是只获取值，一种是将其从队列中取出并返回值
const getEdge = (isEnd) => (arr, isTakeOut) => {
  if (isTakeOut) {
    return isEnd ? arr.pop() : arr.shift();
  }
  return isEnd ? arr.slice(-1)[0] : arr[0];
};
const rmvByIndex = (arr, index) => {
  index = +index;
  if (index < 0 || Number.isNaN(index)) return arr;
  return arr.slice(0, index).concat(arr.slice(index + 1));
};
class TaskQuene {
  constructor(options = {}) {
    this.quene = [];
    // 队列从前往后执行还是从后往前执行,
    // 实现重载constructor(isReverse)
    const isReverse = !!(options && typeof options === "object"
      ? options.reverse
      : options);
    this.getEdageData = getEdge(isReverse);
  }
  queneFunc(fn) {
    let res = null;
    let rej = null;
    const p = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    const func = (...args) => {
      const changeObj = this.quene.find((obj) => obj.p === p);
      if (!changeObj) {
        // 队列清空后，再执行封装后的方法，只会执行原方法
        console.warn("function not in task quene");
        return Promise.resolve().then(() => fn(...args));
      }
      changeObj[statusMark] = typeEnum.FULFILLED;
      Object.assign(changeObj, { res, rej, fn, args });
      this.checkQuene();
      return p;
    };
    const rtnFunc = func.bind(this);
    const setObj = { p, func: rtnFunc };
    setObj[statusMark] = typeEnum.PENDING;
    this.quene.push(setObj);
    return rtnFunc;
  }
  remove(func) {
    if (!func) {
      this.quene = [];
      return;
    }
    const index = this.quene.findIndex((obj) => obj.func === func);
    this.quene = rmvByIndex(this.quene, index);
    this.checkQuene();
  }
  async checkQuene() {
    let obj = this.checkToExec();
    while (obj) {
      const { res, rej, fn, args, p } = obj;
      // fn报错时不会阻塞队列执行
      try {
        const rtn = await fn(...args);
        res(rtn);
        // 等待一个方法所有.then执行完毕再执行下一个
        await p;
      } catch (err) {
        rej(err);
      }
      obj = this.checkToExec();
    }
  }
  checkToExec() {
    const obj = this.getEdageData(this.quene);
    if (obj && obj[statusMark] === typeEnum.FULFILLED) {
      return this.getEdageData(this.quene, true);
    }
    return null;
  }
}

module.exports = TaskQuene;
