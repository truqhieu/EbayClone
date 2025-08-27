# Load Balancer Setup Guide

## Giới thiệu

Hệ thống load balancing này được thiết kế để xử lý lưu lượng người dùng tăng cao thông qua nhiều phương pháp:

1. **Nginx Load Balancer** - Phân phối HTTP requests
2. **Node.js Cluster Mode** - Tận dụng multi-core CPU
3. **Redis Session Management** - Chia sẻ session giữa các instances
4. **Docker Compose** - Triển khai multi-instance
5. **PM2 Process Manager** - Quản lý process production
6. **Health Checks** - Monitoring và auto-recovery

## Các phương pháp triển khai

### 1. Docker Compose (Khuyên dùng)

```bash
# Khởi động toàn bộ hệ thống
docker-compose up -d

# Xem logs
docker-compose logs -f

# Scale backend instances
docker-compose up -d --scale backend-1=2 --scale backend-2=2

# Dừng hệ thống
docker-compose down
```

### 2. PM2 Process Manager

```bash
cd back-end

# Cài đặt dependencies
npm install

# Khởi động với PM2
npm run start:pm2

# Monitoring
npm run monit:pm2

# Xem logs
npm run logs:pm2

# Restart
npm run restart:pm2

# Dừng
npm run stop:pm2
```

### 3. Node.js Cluster Mode

```bash
cd back-end

# Khởi động cluster mode
npm run start:cluster
```

### 4. Manual Setup với Nginx

```bash
# Cài đặt Nginx
sudo apt update
sudo apt install nginx redis-server

# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/your-app
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Khởi động Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Khởi động backend instances
PORT=3001 node server.js &
PORT=3002 node server.js &
PORT=3003 node server.js &
PORT=3004 node server.js &
```

## Cấu hình Load Balancing

### Nginx Load Balancing Methods

1. **Round Robin** (mặc định)
```nginx
upstream backend_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

2. **Least Connections** (khuyên dùng)
```nginx
upstream backend_servers {
    least_conn;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

3. **IP Hash** (session persistence)
```nginx
upstream backend_servers {
    ip_hash;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

4. **Weighted Load Balancing**
```nginx
upstream backend_servers {
    server 127.0.0.1:3001 weight=3;
    server 127.0.0.1:3002 weight=1;
}
```

## Tính năng Load Balancing

### 1. Health Checks
- Endpoint: `GET /health`
- Tự động loại bỏ server lỗi
- Auto-recovery khi server hoạt động lại

### 2. Rate Limiting
- API calls: 10 requests/second
- Login attempts: 5 requests/minute
- Connection limiting: 20 connections/IP

### 3. Session Management
- Redis-based session storage
- Cross-instance session sharing
- Socket.IO scaling với Redis adapter

### 4. Caching
- Static file caching
- Redis caching utilities
- Browser caching headers

## Monitoring & Metrics

### 1. Health Check Endpoints
```bash
# Backend health
curl http://localhost:3001/health

# Nginx status
curl http://localhost/nginx_status
```

### 2. Prometheus & Grafana
```bash
# Truy cập Prometheus
http://localhost:9090

# Truy cập Grafana
http://localhost:3000
# Username: admin, Password: admin123
```

### 3. PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Logs
pm2 logs
```

## Performance Tuning

### 1. Environment Variables

```bash
# .env file
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_URI=mongodb://localhost:27017/your_app
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost

# Node.js performance
NODE_ENV=production
UV_THREADPOOL_SIZE=128
```

### 2. System Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 3. Nginx Optimization

```nginx
# Worker processes
worker_processes auto;
worker_connections 2048;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;

# Timeouts
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;
```

## Scaling Strategies

### 1. Horizontal Scaling
- Thêm backend instances
- Load balancer tự động phân phối
- Redis đảm bảo session consistency

### 2. Vertical Scaling
- Tăng CPU/RAM cho server
- Cluster mode tận dụng multi-core
- Tối ưu database connections

### 3. Auto Scaling
```bash
# Docker Swarm auto scaling
docker service create --replicas 3 --name backend backend:latest
docker service scale backend=5
```

## Troubleshooting

### 1. Common Issues

**Connection refused:**
```bash
# Check if services are running
docker-compose ps
pm2 list
netstat -tulpn | grep :3001
```

**Redis connection error:**
```bash
# Check Redis
redis-cli ping
docker logs redis_cache
```

**High CPU usage:**
```bash
# Check PM2 processes
pm2 monit
top -p $(pgrep -d, -f "node")
```

### 2. Log Analysis

```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
docker-compose logs -f backend-1
pm2 logs app-instance-1

# System logs
journalctl -u nginx -f
```

### 3. Performance Testing

```bash
# Load testing với Apache Bench
ab -n 10000 -c 100 http://localhost/api/health

# Load testing với wrk
wrk -t12 -c400 -d30s http://localhost/api/health
```

## Security Considerations

### 1. SSL/TLS
```nginx
# Enable HTTPS
listen 443 ssl http2;
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
```

### 2. Firewall Rules
```bash
# UFW configuration
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001:3004/tcp
```

### 3. Rate Limiting
- Implemented in Nginx config
- Redis-based rate limiting
- DDoS protection

## Backup & Recovery

### 1. Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/your_app"

# Redis backup
redis-cli SAVE
```

### 2. Configuration Backup
```bash
# Backup configs
tar -czf configs-backup.tar.gz nginx.conf docker-compose.yml ecosystem.config.js
```

## Kết luận

Hệ thống load balancing này cung cấp:
- **High Availability**: Tự động failover khi server lỗi
- **Scalability**: Dễ dàng thêm/bớt instances
- **Performance**: Tối ưu hóa throughput và response time
- **Monitoring**: Theo dõi real-time performance
- **Security**: Rate limiting và DDoS protection

Lựa chọn phương pháp triển khai phù hợp với môi trường của bạn:
- **Development**: Node.js Cluster hoặc PM2
- **Production**: Docker Compose với Nginx
- **Enterprise**: Kubernetes với Ingress Controller