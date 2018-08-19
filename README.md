# coredns-admin

coredns的管理配置后台(coredns使用etcd保存数据)，可以自动检测IP是否可用，可用则增加DNS解析，不可用则删除

## docker build

```bash
docker build -t vicanso/coredns-admin .
```

## docker run 

```bash
docker run -d --restart=always \
  -e NODE_CONFIG_DIR=/app/config \
  -v ~/production.yml:/app/config/production.yml \
  -p 5018:5018 \
  vicanso/coredns-admin
```

### production.yml

production的配置，覆盖default.yml

```yaml
log:
  # 日志输出至console
  console: true
# mongodb连接串
mongo: mongodb://user:pwd@ip:port/coredns?connectTimeoutMS=10000
secret:
  # 用于认证解密使用，需自己指定，而且不可泄露
  - secretkey 
coredns:
  # coredns中使用的etcd
  etcd: 172.18.16.118:2371,172.18.16.118:2372,172.18.16.118:2373
  path: /coredns
dns:
  # 刷新的间隔
  freshInterval: 10000
```