export namespace app {
	
	export class app {
	
	
	    static createFrom(source: any = {}) {
	        return new app(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	export class log {
	
	
	    static createFrom(source: any = {}) {
	        return new log(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

