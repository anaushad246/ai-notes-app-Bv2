class ApiResponse {
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message
        
        // OLD CODE (commented out due to issues):
        // this.statusCode = statusCode < 400 // This was overwriting the statusCode with boolean
        
        // NEW CODE (fixed):
        this.success = statusCode < 400
    }
}
export  { ApiResponse }