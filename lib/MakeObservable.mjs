const MakeObservable = (obj)=>{
    let observers = {}
    let observable = {}
    let cached = Object.assign({}, obj)
    const changed = (key, old, v)=>{
      if(!observers[key]) return
      observers[key].forEach(o=>o["update"] ? o.update(key, old, v) : o(key, old, v))
    }
    Object.keys(cached).forEach( key => {
      Reflect.defineProperty(observable, key, {
        get(){
          return cached[key]
        },
        set(v){
          let old = cached[key]
          cached[key] = v
          changed(key, old, v)
        },
        enumerable: true
      })
    })
    observable = Object.assign(observable, {
      observe(key, observer){
        if(!observers[key]) observers[key] = []
        observers[key].push(observer)
      },
      stopObserving(key, observer){
        if(!observers[key]) return
        const index = observers[key].findIndex( o => o === observer )
        observers[key].splice(index, 1)
      }
    })
    return observable
  }
  
  export default MakeObservable
  