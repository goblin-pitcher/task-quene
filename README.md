## 任务队列化

​        执行多个异步操作时，期望异步方法的回调能按需要的顺序执行。

​        `taskQuene`的作用是将回调塞入队列，只有当前面回调全部触发，才会逐个执行已触发的回调。可选择回调是从前往后执行还是从后往前执行

### 使用方法

  ````javascript
const f1 = (...args)=>{...}
const f2 = (...args)=>{...}
const f3 = (...args)=>{...}

const pipe = new TaskQuene()

const r1 = pipe.queneFunc(f1)
const r2 = pipe.queneFunc(f2)
const r3 = pipe.queneFunc(f3)

r2() // 队列前面还有r1未触发, 不执行
r3() // 队列前面还有r1未触发, 不执行
r1() // 队列前面没有待触发项, 顺序执行f1、f2、f3
  ````

也可以选择执行方向

````javascript
const pipe = new TaskQuene({reverse: true})
// 或直接 const pipe = new TaskQuene(true) 

const r1 = pipe.queneFunc(f1)
const r2 = pipe.queneFunc(f2)
const r3 = pipe.queneFunc(f3)

r1() // 队列后面还有r2、r3未触发, 不执行
r2() // 队列后面还有r3未触发, 不执行
r3() // 顺序执行f3、f2、f1
````

支持异步方法，且能获取异步方法返回值，队列中某个方法报错不会阻塞队列的执行

````javascript
pipe = new TaskQuene()
f1=async (...args)=>{
    const r = await new Promise((res)=>{
        setTimeout(()=>{
            res(args.concat('end'))
        })
    })
    return r
}
f2=()=>{
    throw new Error('f2 error test')
}
f3=(...args)=>{console.log('f3::',args)}
// 分别对需要执行的方法进行封装，f1、f2、f3最终的执行顺序依赖于放入队列的顺序
r1 = pipe.queneFunc(f1)
r2 = pipe.queneFunc(f2)
r3 = pipe.queneFunc(f3)

setTimeout(()=>{
    console.log('r2 timeout work')
    r2()
}, 500)

setTimeout(()=>{
    console.log('r3 timeout work')
    r3('f3-args', 2,2,8)
}, 1000)
setTimeout(async ()=>{
    console.log('r1 timeout work')
    const res = await r1('f1-args',1,1,8)
    console.log(res)
}, 3000)

// r2 timeout work
// r3 timeout work
// r1 timeout work
// ["f1-args", 1, 1, 8, "end"]
// r2 Error log
// f3:: ["f3-args", 2, 2, 8]

// ------------------------------------------------------------------
// 注意，此时任务队列清空了，r1、r2、r3不再具有队列效果了
setTimeout(()=>{
    setTimeout(()=>{
        console.log('r2 timeout work')
        r2()
    }, 500)
    
    setTimeout(()=>{
        console.log('r3 timeout work')
        r3('f3-args', 2,2,8)
    }, 1000)
    setTimeout(async ()=>{
        console.log('r1 timeout work')
        const res = await r1('f1-args',1,1,8)
        console.log(res)
    }, 3000)
}, 5000)

// r2 timeout work
// r2 Error log
// r3 timeout work
// f3:: ["f3-args", 2, 2, 8]
// r1 timeout work
// ["f1-args", 1, 1, 8, "end"]
````

**注意：放入队列的方法，执行完毕之后直接出队列，再执行封装后的r1、r2、r3方法，只会按顺序执行，队列化的方法`pipe.queneFunc`只相当于一个once事件**