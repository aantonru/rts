import * as MU from "three/src/math/MathUtils"
class Math3 {
    PI:number;
    constructor(){
        this.PI=Math.PI;
    }
    rand(x0=0, x1=1):number{
        return (Math.random()*(x1-x0)+x0);
    }
    mapLinear( x:number, a1:number, a2:number, b1:number, b2:number):number{
        return MU.mapLinear(x,a1,a2,b1,b2);
    }
    fract(x=1):number{
        return (x-Math.floor(x));
    }
    map(x=0, a0=0, a1=1, b0=0, b1=1){
        return MU.mapLinear(x,a0,a1,b0,b1);
    }
}

export const M3 = new Math3();

