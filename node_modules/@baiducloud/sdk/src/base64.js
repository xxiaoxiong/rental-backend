/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file src/base64.js
 * @author lurunze
 */

function getEnv() {
    if (typeof global !== 'undefined') {
      return 'Node.js';
    } else if (typeof window !== 'undefined') {
      return 'Browser';
    } else {
      return 'Unknown environment';
    }
}

exports.urlEncode = function urlEncode(inputStr) {
    const env = getEnv();
    let base64Str = inputStr && typeof inputStr ==='string'? inputStr : JSON.stringify(inputStr);

    if (env === 'Node.js') {
        const buffer = Buffer.from(base64Str, 'utf8');
        base64Str = buffer.toString('base64');
    }
    else if (env === 'Browser') {
        base64Str = window.btoa(base64Str);
    }

    return base64Str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

exports.urlDecode = function urlDecode(inputStr) {
    const env = getEnv();
    let result = (inputStr && typeof inputStr === 'string' ? inputStr : '').replace(/\-/g, '+').replace(/\_/g, '/');

    if (env === 'Node.js') {
        result = Buffer.from(result, 'base64').toString('utf-8');
    }
    else if (env === 'Browser') {
        result = window.atob(str);
    }

    return result;
}
