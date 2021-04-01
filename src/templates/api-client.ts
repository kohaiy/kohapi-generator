import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

interface ReqParam {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
}

interface Handlers {
  beforeRequest?: Function;
  afterRequest?: Function;
  afterError?: Function;
}

async function mapRes<T>(promise: Promise<AxiosResponse<T>>, handlers?: Handlers): Promise<{ data?: T; error?: { statusCode: number; message: string } }> {
  try {
    if (handlers && handlers.beforeRequest) {
      handlers.beforeRequest();
    }
    const res = await promise;
    const { data } = res;
    if (handlers && handlers.afterRequest) {
      handlers.beforeRequest({ data });
    }
    return { data };
  } catch (e) {
    let error = {
      statusCode: -1,
      message: e.message,
    };
    if (e.response) {
      const response = e.response as AxiosResponse;
      error = response.data;
    }
    if (handlers && handlers.afterRequest) {
      handlers.beforeRequest({ error });
    }
    if (handlers && handlers.afterError) {
      handlers.afterError({ error });
    }
    return {
      error,
    };
  }
}

function replacePath(path: string, params?: Record<string, any>) {
  const matches = path.match(/{.+?}/g);
  if (matches && matches.length) {
    if (!params) {
      throw new Error('[ApiClient] replacePath -> path params cannot be undefined.');
    }
    matches.forEach((m: string) => {
      const value = params[m.slice(1, -1)];
      if (value) {
        path = path.replace(m, value);
      } else {
        throw new Error(`[ApiClient] replacePath -> path params \`${m}\` not found`);
      }
    });
  }
  return path;
}

export default class ApiClient {
  private static instance: AxiosInstance | null = null;
  private static handlers: Handlers = {};

  private constructor() {
    console.log('ApiClient Created.');
  }

  static setInstance(instance: AxiosInstance) {
    this.instance = instance;
  }

  static beforeRequest(handler: () => void) {
    this.handlers.beforeRequest = handler;
  }
  static afterRequest(handler: (payload: { data?: any; error?: any }) => void) {
    this.handlers.afterRequest = handler;
  }
  static afterError(handler: (error?: any) => void) {
    this.handlers.afterError = handler;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = axios.create();
    }
    return this.instance;
  }

  static httpGet<T>(path: string, reqParam: ReqParam) {
    return mapRes<T>(this.getInstance().get(
      replacePath(path, reqParam.params),
      {
        params: reqParam.query,
      },
    ));
  }

  static httpPost<T>(path: string, reqParam: ReqParam) {
    return mapRes<T>(this.getInstance().post(
      replacePath(path, reqParam.params),
      reqParam.body,
      {
        params: reqParam.query,
      },
    ));
  }

  static httpPut<T>(path: string, reqParam: ReqParam) {
    return mapRes<T>(this.getInstance().put(
      replacePath(path, reqParam.params),
      reqParam.body,
      {
        params: reqParam.query,
      },
    ));
  }

  static httpPatch<T>(path: string, reqParam: ReqParam) {
    return mapRes<T>(this.getInstance().patch(
      replacePath(path, reqParam.params),
      reqParam.body,
      {
        params: reqParam.query,
      },
    ));
  }

  static httpDel<T>(path: string, reqParam: ReqParam) {
    return mapRes<T>(this.getInstance().delete(
      replacePath(path, reqParam.params),
      {
        params: reqParam.query,
      },
    ));
  }
}
