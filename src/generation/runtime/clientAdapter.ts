export interface RequestOptions { headers?: Record<string, string>; baseURL?: string; timeout?: number; query?: Record<string, any> }

export interface ClientAdapter {
  get<T>(url: string, options?: RequestOptions): Promise<T>
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  delete<T>(url: string, options?: RequestOptions): Promise<T>
}