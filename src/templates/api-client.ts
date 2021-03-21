import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

interface ReqParam {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
}

async function mapRes<T>(promise: Promise<AxiosResponse<T>>): Promise<{ data?: T; error?: { code: number; msg: string } }> {
  try {
    const res = await promise;
    const { data } = res;
    return { data };
  } catch (e) {
    if (e.response) {
      const response = e.response as AxiosResponse;
      console.error(response.data.msg);
      if (response.status === 401) {
        // router.replace({
        //     name: 'Login',
        // });
      }
      return { error: response.data };
    }

    return {
      error: {
        code: -1,
        msg: e.message,
      },
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

  private constructor() {
    console.log('ApiClient Created.');
  }

  static setInstance(instance: AxiosInstance) {
    this.instance = instance;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: '/api',
      });
      this.instance.interceptors.request.use((config: AxiosRequestConfig) => {
        if (localStorage.getItem('token')) {
          config.headers = config.headers || {};
          config.headers.authorization = localStorage.getItem('token');
        }
        return config;
      });
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
