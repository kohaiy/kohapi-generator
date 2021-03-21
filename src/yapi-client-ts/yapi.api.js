const axios = require('axios');

class YapiApi {
    constructor({ baseUrl, token }) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    async _loadYapi(url, params = {}) {
        const res = await axios.get(this.baseUrl + url, { params: { token: this.token, ...params } });
        if (res.data && res.data.errcode === 0) {
            return res.data.data;
        }
        throw new Error(res.data && res.data.errmsg);
    }

    // 获取项目基本信息
    getProjectInfo() {
        return this._loadYapi('/api/project/get');
    }

    // 获取项目分类列表
    getCatMenu() {
        return this._loadYapi('/api/interface/getCatMenu');
    }

    // 获取分类下所有接口
    getApisByCat(catid) {
        return this._loadYapi('/api/interface/list_cat', { catid, page: 1, limit: 50000 });
    }

    // 获取接口详情
    getApiDetail(id) {
        return this._loadYapi('/api/interface/get', { id });
    }
}

module.exports = YapiApi;
