import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:60000,fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:4173',channel:'msedge',headless:true,viewport:{width:1440,height:1000}},
 webServer:{command:'node tools/serve.js',url:'http://127.0.0.1:4173',reuseExistingServer:true},
 reporter:'list',
});
