# Nginx Load Balancer với Node.js

Hệ thống load balancer sử dụng Nginx để phân phối tải cho nhiều backend servers Node.js, giúp xử lý lượng yêu cầu lớn từ người dùng.

## 🏗️ Kiến trúc hệ thống

```
                    ┌─────────────────┐
                    │   Người dùng    │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │  Nginx (Port 80) │
                    │  Load Balancer   │
                    └─────────┬───────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐ ┌────────▼──────┐ ┌───────▼──────┐
    │   APP-1      │ │     APP-2     │ │    APP-3     │
    │  (Port 3000) │ │  (Port 3000)  │ │ (Port 3000)  │
    └──────────────┘ └───────────────┘ └──────────────┘
                              │
                    ┌─────────▼───────┐
                    │  APP-4 (Backup) │
                    │   (Port 3000)   │
                    └─────────────────┘
```

## 🚀 Cách chạy hệ thống

### 1. Sử dụng Docker Compose (Khuyến nghị)

```bash
# Build và start toàn bộ hệ thống
docker-compose up --build

# Chạy ở background
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng hệ thống
docker-compose down
```

### 2. Chạy thủ công

```bash
# Cài đặt dependencies
npm install

# Chạy backend servers (mở 4 terminal khác nhau)
SERVER_ID=APP-1 PORT=3001 node app.js
SERVER_ID=APP-2 PORT=3002 node app.js
SERVER_ID=APP-3 PORT=3003 node app.js
SERVER_ID=APP-4 PORT=3004 node app.js

# Cấu hình Nginx (cần điều chỉnh ports trong nginx.conf)
sudo nginx -t -c /path/to/nginx.conf
sudo nginx -s reload
```

## 🔧 Cấu hình Load Balancer

### Nginx Load Balancing Methods:

1. **Round Robin** (mặc định): Phân phối đều theo vòng tròn
2. **Least Connections**: Gửi request đến server có ít connection nhất
3. **IP Hash**: Dựa trên IP của client
4. **Random**: Ngẫu nhiên

```nginx
upstream backend_servers {
    least_conn;  # Sử dụng least connections
    
    server app1:3000 weight=3 max_fails=3 fail_timeout=30s;
    server app2:3000 weight=3 max_fails=3 fail_timeout=30s;
    server app3:3000 weight=2 max_fails=3 fail_timeout=30s;
    server app4:3000 weight=1 backup;  # Backup server
}
```

## 📊 Monitoring và Health Check

### Health Check Script
```bash
# Chạy health check
./health-check.sh
```

### Endpoints để kiểm tra:
- `http://localhost/` - Trang chính
- `http://localhost/health` - Health check
- `http://localhost/api/users` - API users
- `http://localhost/api/heavy` - CPU intensive task
- `http://localhost/nginx-health` - Nginx health

### Monitoring với Prometheus & Grafana:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 🧪 Test Load Balancing

### Chạy test tự động:
```bash
node test-load-balancer.js
```

### Test thủ công:
```bash
# Test load distribution
for i in {1..10}; do
  curl -s http://localhost/ | jq -r '.server'
done

# Test với ab (Apache Bench)
ab -n 1000 -c 10 http://localhost/

# Test với curl
curl -s http://localhost/ | jq .
```

## ⚡ Tối ưu hóa hiệu suất

### 1. Nginx Configuration
- **Worker Processes**: `worker_processes auto;`
- **Worker Connections**: `worker_connections 1024;`
- **Keepalive**: `keepalive 32;`
- **Gzip Compression**: Bật để giảm bandwidth
- **Rate Limiting**: Chống DDoS và spam

### 2. Backend Optimization
- **Clustering**: Sử dụng Node.js cluster
- **Connection Pooling**: Pool database connections
- **Caching**: Redis cho session và cache
- **Health Checks**: Tự động remove unhealthy servers

### 3. System Level
```bash
# Tăng file descriptor limits
ulimit -n 65536

# Optimize TCP settings
echo 'net.core.somaxconn = 65536' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65536' >> /etc/sysctl.conf
sysctl -p
```

## 📈 Scaling Strategies

### Horizontal Scaling
```bash
# Thêm server mới
docker-compose up --scale app1=2 --scale app2=2

# Update Nginx config để add thêm servers
# Reload Nginx
docker-compose exec nginx nginx -s reload
```

### Auto Scaling với Docker Swarm
```yaml
version: '3.8'
services:
  app:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

## 🔒 Security Best Practices

1. **Rate Limiting**: Giới hạn requests per IP
2. **SSL/TLS**: HTTPS cho production
3. **Security Headers**: X-Frame-Options, CSP, etc.
4. **Firewall**: Chỉ mở ports cần thiết
5. **Regular Updates**: Update Nginx và dependencies

## 📝 Logs và Debugging

### Xem logs:
```bash
# Nginx logs
docker-compose logs nginx

# Application logs
docker-compose logs app1 app2 app3 app4

# Real-time monitoring
docker-compose logs -f
```

### Log files location:
- Nginx access log: `/var/log/nginx/access.log`
- Nginx error log: `/var/log/nginx/error.log`
- Application logs: stdout/stderr

## 🚨 Troubleshooting

### Common Issues:

1. **502 Bad Gateway**
   - Check if backend servers are running
   - Verify upstream configuration
   - Check firewall/network connectivity

2. **High Response Times**
   - Monitor server resources (CPU, Memory)
   - Check database performance
   - Review application bottlenecks

3. **Uneven Load Distribution**
   - Check server weights
   - Verify health check configuration
   - Review load balancing method

## 📚 Tài liệu tham khảo

- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Node.js Clustering](https://nodejs.org/api/cluster.html)
- [Docker Compose](https://docs.docker.com/compose/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

## 🎯 Production Checklist

- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Health checks working
- [ ] Auto-scaling configured
- [ ] Security headers set
- [ ] Database connection pooling
- [ ] Cache layer (Redis) setup