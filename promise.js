
class MyPromise {
    static PENDING = "pending"
    static FULFILLED = "fulfilled"
    static REJECTED = "rejected"
    constructor(executer){
        this.state = MyPromise.PENDING
        this.value = null
        this.callbacks = []
        // 使用try catch 保证函数体内得报错
        try {
        // bind this 保证this 永远指向MyPromise
            executer(this.resolve.bind(this),this.reject.bind(this))
        } catch (err) {
            this.reject(err)
        }
    }
    resolve(value){
        // 只有在 peding 状态时才让改变 state。防止状态倒流
        if(this.state===MyPromise.PENDING){
            this.state = MyPromise.FULFILLED;
            this.value = value
           setTimeout(()=>{
            this.callbacks.forEach(({onFulfilled})=>{
                try {
                    onFulfilled(this.value)
                } catch (error) {
                    this.reject(error)
                }
            })
           })
        }
    }
    reject(reason){
        if(this.state===MyPromise.PENDING){
            this.state = MyPromise.REJECTED
            this.value  = reason
            setTimeout(()=>{
                this.callbacks.forEach(({onReject})=>{
                    onReject(this.value)
                   
                })
            })
        }
    }
    /*
        let p = new MyPromise((resolve,reject)=>{
            setTimeout(()=>{
                resolve("解决")
            },1000)
            // reject("失败")
        })
        像这种异步调用，因为resolve 被滞后调用，但是then 方法是同步执行得，所有虽然 reslove被1秒后调用成功，
        但是then 已经提前调用，并且没有获取到状态和值
    */ 
    then(onFulfilled,onReject){
        if(typeof onFulfilled!="function"){
            // then() 解决这种空得then时候得穿透问题
            onFulfilled = ()=> {this.value;this.state=MyPromise.FULFILLED}
        }
        if(typeof onReject!="function"){
            onReject = ()=>{this.value;this.state=MyPromise.FULFILLED}
        }
        // 返回一个新的 promise 重复上面操作
      let promise = new MyPromise ((resolve,reject)=>{
                if(this.state===MyPromise.PENDING){
                    this.callbacks.push({
                        onFulfilled:(valve)=>{
                           this.parse(promise,onFulfilled(valve),resolve,reject)
                        },
                        onReject:(valve)=>{
                            this.parse(promise,onFulfilled(valve),resolve,reject)
                        }
                    })
                }
                if(this.state===MyPromise.FULFILLED){
                    // 保证到异步队列
                    setTimeout(()=>{
                        this.parse(promise,onFulfilled(this.value),resolve,reject)
                    })
                }
                if(this.state===MyPromise.REJECTED){
                    setTimeout(()=>{
                        this.parse(promise,onReject(this.value),resolve,reject,true)
                    })
                   
                }
       })
       return promise
    }
    parse(promise,result,reject,resolve,mark){
        // 不允许返回自己
        if(promise===result){
            throw new TypeError("Chaning cycle detected for promise")
        }
        try {
            if(result instanceof MyPromise ){
                result.then(resolve,reject)
            }else{  
               if(mark){
                   reject(result)
               }else resolve(result)
            }
        } catch (error) {
            reject(error)
        }
    }
    static resolve (value){
        return new MyPromise((resolve,reject)=>{
            if(value instanceof MyPromise){
                value.then(resolve,reject)
            }else{
                resolve(value)
            }
        })
    }
    static reject (value){
        return new MyPromise((resolve,reject)=>{
            if(value instanceof MyPromise){
                value.then(resolve,reject)
            }else{
                reject(value)
            }
        })
    }
    static all(promises){
        const value = []
        return new MyPromise((resolve,reject)=>{
            promises.forEach((promise)=>{
                promise.then(res=>{
                    value.push(res)
                    if(value.length===promises.length){
                        resolve(value)
                    }
                },(reson)=>{
                    reject(reson)
                })
            })
            
        })
    }
    static race(promises){
       return new MyPromise((resove,reject)=>{
        promises.forEach(promise=>{
            promise.then(value=>{
                resove(value,1111)
                },reason=>{
                    reject(reason)
                })
            })
        })
    }
}