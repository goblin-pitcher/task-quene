const TaskQuene = require("../");

const sleep = (time = 0) =>
  new Promise((res) => {
    setTimeout(res, time);
  });

test("callback exec by quene", async (done) => {
  const func = jest.fn((val) => val);
  const pipe = new TaskQuene();
  const [f1, f2, f3] = [1, 2, 3].map((item) => () => {
    func(`f${item}`);
  });
  const [r1, r2, r3] = [f1, f2, f3].map((f) => pipe.queneFunc(f));
  await Promise.all([r2(), r3(), r1()]);
  expect(func).toHaveNthReturnedWith(1, "f1");
  expect(func).toHaveNthReturnedWith(2, "f2");
  expect(func).toHaveNthReturnedWith(3, "f3");
  expect(func).toHaveBeenCalledTimes(3);
  done();
});

test("callback exec async function and ignore error", async (done) => {
  const func = jest.fn();
  const pipe = new TaskQuene();
  const f1 = async () => {
    await new Promise((res) => {
      setTimeout(() => {
        func("f1");
        res();
      }, 500);
    });
    return "f1 res";
  };
  const f2 = async () => {
    func("f2");
    throw new Error("f2 fail");
  };
  const f3 = async () => {
    await new Promise((res) => {
      setTimeout(() => {
        func("f3");
        res();
      }, 100);
    });
    return "f3 res";
  };
  const [r1, r2, r3] = [f1, f2, f3].map((f) => pipe.queneFunc(f));
  const [p2, p3, p1] = [r2(), r3(), r1()];
  await Promise.allSettled([p2, p3, p1]);
  expect(func).toHaveBeenNthCalledWith(1, "f1");
  expect(func).toHaveBeenNthCalledWith(2, "f2");
  expect(func).toHaveBeenNthCalledWith(3, "f3");
  expect(func).toHaveBeenCalledTimes(3);
  expect(p1).resolves.toEqual("f1 res");
  expect(p2).rejects.toEqual(Error("f2 fail"));
  expect(p3).resolves.toEqual("f3 res");
  done();
});
