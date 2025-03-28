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

export namespace updater {
	
	export class VersionInfo {
	    version: string;
	    url: string;
	    releaseDate: string;
	    required: boolean;
	    signature: string;
	
	    static createFrom(source: any = {}) {
	        return new VersionInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.url = source["url"];
	        this.releaseDate = source["releaseDate"];
	        this.required = source["required"];
	        this.signature = source["signature"];
	    }
	}

}

