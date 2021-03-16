class Promisa {
  constructor(instFun) {
    this.PENDING = "pending";
    this.REJECT = "reject";
    this.FUFILLED = "fufilled";
    this.state = this.PENDING;
    this.value = null;
    this.callBack = [];
    instFun(this.resolve.bind(this), this.reject.bind(this));
  }
  resolve(value) {
    if (this.state === this.PENDING) {
      this.state = this.FUFILLED;
      this.value = value;
      this.callBack.forEach(item=>{
        item.fufilledFun(value)
      })

    }
  }
  reject(value) {
    if (this.state === this.PENDING) {
      this.state = this.REJECT;
      this.value = value;
      this.callBack.forEach(item=>{
        item.rejectFun(value)
      })
    }
  }
  // this问题，由于使用箭头函数，在函数内，声明的箭头函数都指向当前函数。
  // 所有，当你下个then 时，其实new promise的时候会指向最新生成的 promise实例
  then(fufilledFun, rejectFun) {
    let saveFufilledFun = fufilledFun
    let saveRejectFun = rejectFun
    // 解决穿透问题，链式调用上次的then 为空时的场景
    if (typeof fufilledFun != "function") {
      fufilledFun = () => this.value;
    }
    if (typeof rejectFun != "function") {
      rejectFun = () => this.value;
    }
    // 判断三个状态
    // 状态1 pending状态，由于。then的方法调用是同步（.then(fun)中fun是异步微任务），
    // 但是，在你的instFun中存在异步，
    // instFun 的函数体是异步的所以.then的时候没有走到resolve
      let self = this
      // fufilledFun 和 rejectFun 都是当前的， 执行用于返回（当前fufilledFun的returen值）下次的 then调取使用
      // resolve reject 是下次的值，用于改不，下次的then的状态和value 值
    return new Promisa((resolve,reject)=>{
      // 要保持上次的this, 如果不保存，此时的this.是新new 出来的promise  此时的 state 会走的 pedding 状态，走不到 fuilled
      if (self.state === self.PENDING) {
        // 当前的 value 值 在被调用是，会得到
        self.callBack.push(
          {
            fufilledFun:(value) => {
              // 1 先拿当前值来执行当前的fufilledFun，不管返回什么，执行当前函数
              let result = fufilledFun(value)
              // 2 判断当前函数值是什么类型，如果返回的promise 那就 下次resolve的值，拿的是 promise.then(value=>{}) value的值
              if( result instanceof Promisa){
                result.then((item)=>{
                  resolve(item)
                })
              }else{
                resolve(result)
              }
            },
            rejectFun:(value) => {
             let result =  rejectFun(value)
              if(result instanceof Promisa){
                value.then((item)=>reject(item))
              }
              reject(value)
            }
          }
        );
      }
      if (self.state === self.FUFILLED) {
        setTimeout(() => {
          let result  = fufilledFun(self.value);
          if(result instanceof Promisa){
            result.then(value=>{
              resolve(value)
            })
          }else{
            resolve(result)
          }
        });
      }
      if (self.state === self.REJECT) {
        // 如果当前的 rejectFun 返回的有值，将进入下一个promise 的resolve
        setTimeout(() => {
          const result = rejectFun(self.value)
          if(result instanceof Promisa){
            result.then(res=>{
              if(typeof saveRejectFun!="function"){
                reject(res)
              }else{
                resolve(res)
              }
            })
          }else{
            /*
              const promise = new Promisa((resolve, reject) => {
                  reject(11111); 
              });
              promise.then((res) => {
                console.log(res + "resolve");
                return new Promisa((resolve,rej)=>{resolve(1)})
                // return 2222
              }).then(res=>console.log(res,"res"))
            */
           // 上面的用力，如果第一个为失败，第二个，和第三个为 resolve 
           // 第一个then时由于没有传值 rejectFun  上面的rejectFun = () => this.value;穿透函数导致返回了有值，所以满足了上面规则
           // 在rejectFun 中返回的有值，走下个then 的resolveFun
            if(typeof saveRejectFun!="function"){
              reject(result)
            }else{
              resolve(result)
            }
          }
        });
      }
    })
  }
  static all(list){
    const PromiseResult = []
    const RjectReason = []
    return new Promisa((resolove,reject)=>{
      // 由于 promise.then(fun1,fun2) fun1 ,fun2为异步的，导致，这些数据要放到callBack 中执行
      list.forEach(promise=>{
        promise.then(res=>{
          PromiseResult.push(res)
          if(PromiseResult.length===list.length){
            resolove(PromiseResult)
          }
        },rej=>{
          // 这里不怕多个失败的原因是 上面声明了一个promise 所以此时的promise状态已经改过
          RjectReason.push(rej)
          // if(RjectReason.length===1){
            reject(rej)
          // }
        })
      })
    })
    // list.forEach(promise=>{
    // 如果把新的promise放在这list.forEacth里面，无法通过return 单个值，
    // for(let i = 0;i<list.length;i++){
      // let promise = list[i]
      // promise.then((value)=>{
       
        // PromiseResult.push(value)
        // if(PromiseResult.length===list.length){
        //      return new Promisa((res,rej)=>{
        //         rej(RjectReason[0])
        //     })
        // }
        // emitFun.emit()
      // },(rej)=>{
        // if(rej){
            //  return new Promisa((res)=>{
              // res(PromiseResult)
            // })
        // emitFun.emit()
        // }
      // })
    // }
    // emitFun.on(()=>{
    //   if(PromiseResult.length===list.length){
    //     return new Promisa((res,rej)=>{
    //       res(PromiseResult)
    //     })
    //   }
    //   if(RjectReason.length==1){
    //     return new Promisa((res)=>{
    //       rej(RjectReason[0])
    //     })
    //   }
    // })
    // })
    // 写这不行的原因是因为，执行then(函数1，函数2) 这两个函数是异步的，所以会先执行到下面，导致RjectReason，一值是空数组
    // if(RjectReason.length){
    //   return new Promisa((res,rej)=>{
    //     rej(RjectReason[0])
    //   })
    // }else{
    //   return new Promisa((res)=>{
    //     res(PromiseResult)
    //   })
    // }
  }
  static race(list){
   return new Promisa((resolve,reject)=>{
      list.forEach(promise=>{
        promise.then((res)=>{
          resolve(res)
        },rej=>{
          reject(rej)
        })
      })
    })
  }
  // 如果 value 是 promise 的话，如果是失败状态会返回失败，并不一定都是成功,不过都是处理后的值
  static resolve(value){
    if(value instanceof Promisa){
      return value
    }
    return new Promisa((resolve)=>{
      resolve(value)
    })
  }
  // 如果 value 是 promise 的话，直接返回promise，一定走reject
  static reject(value){
    return new Promisa((res,rej)=>{
      rej(value)
    })
  }
}
// const promise = new Promisa((resolve, reject) => {
//   // setTimeout(()=>{
//     // resolve(11111); 
//     reject(11111); 
//   // },4000)
// });
// promise.then((res) => {
//   console.log(res + "resolve");
//   return new Promisa((resolve,rej)=>{resolve(1)})
//   // return 2222
// },()=>{
//   return "mmm"
// }).then(res=>console.log(res,"res"))
// 用力1 
// then 一直都是同步
// 第二次调用then 的时候，由于，第一次的 new promise时，4 秒异步，所有一直没有执行，
// resolve 所以当前状态 pending（应为下个resolve 没有执行，导致，当前的 下次then的fufilledFun 函数没有执行）,第二次的then 的时候，因为是同步的得到的state为pending
// const promise = new Promisa((resolve, reject) => {
//   setTimeout(()=>{
//     resolve(11111); 
//   },4000)
// });
// promise.then((res) => {
//   console.log(res + "resolve");
//   return new Promisa((resolve,rej)=>{resolve(1)})
// }).then(res=>{console.log(res,"fffff")}


// all 用力
// const p1 = new Promisa((res,rej)=>{
//   rej(1111)
// })
// const p2 = new Promisa((res,rej)=>{
//   rej(2222)
// })
// Promisa.all([p1,p2]).then((res)=>{
//   console.log(res,"res")
// },(rej)=>{console.log(rej,"rej")})
// race 用力
// const p1 = new Promisa((res,rej)=>{
//   setTimeout(()=>res(1111),3000)
// })
// const p2 = new Promisa((res,rej)=>{
//   res(2222)
// })
// Promisa.race([p1,p2]).then((res)=>{
//   console.log(res,"res")
// },(rej)=>{console.log(rej,"rej")})
// Resolve


// resolve 用力
// Promisa.resolve(1).then(res=>{
//   console.log(res)
// })
// Promisa.resolve(new Promisa((res,rej)=>res(1))).then(res=>{
//   console.log(res,"ressss")
// },()=>{
//   console.log(red,"red")
// })
// Promisa.resolve(new Promisa((res,rej)=>rej(1))).then(res=>{
//   console.log(res,"ressss")
// },(rej)=>{
//   console.log(rej,"rej")
// })

// reject 用力
// Promisa.reject(1).then(res=>console.log(res))
// Promisa.reject(new Promisa((res,rej)=>res(1))).then(null,rej=>{console.log(rej,"rej")})
