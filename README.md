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
