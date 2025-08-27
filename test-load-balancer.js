// Load Balancer Testing Script
const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class LoadBalancerTester {
    constructor(baseUrl = 'http://localhost') {
        this.baseUrl = baseUrl;
        this.results = {
            requests: [],
            servers: {},
            errors: [],
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0
        };
    }

    // Make HTTP request with timing
    async makeRequest(path = '/', method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'LoadBalancerTester/1.0'
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;
                    
                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            responseTime: responseTime,
                            data: parsedData,
                            server: parsedData.server || 'unknown',
                            headers: res.headers
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            responseTime: responseTime,
                            data: responseData,
                            server: 'unknown',
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                reject({
                    error: error.message,
                    responseTime: responseTime
                });
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Test load distribution
    async testLoadDistribution(numRequests = 20, concurrency = 5) {
        console.log(`\n🔄 Testing load distribution with ${numRequests} requests (concurrency: ${concurrency})`);
        console.log('='.repeat(60));

        const batches = Math.ceil(numRequests / concurrency);
        const allRequests = [];

        for (let batch = 0; batch < batches; batch++) {
            const batchSize = Math.min(concurrency, numRequests - batch * concurrency);
            const batchPromises = [];

            for (let i = 0; i < batchSize; i++) {
                batchPromises.push(this.makeRequest('/'));
            }

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                allRequests.push(...batchResults);
                
                // Small delay between batches
                if (batch < batches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error('Batch error:', error);
            }
        }

        this.processResults(allRequests);
        this.displayResults();
    }

    // Test different endpoints
    async testEndpoints() {
        console.log('\n🌐 Testing different endpoints');
        console.log('='.repeat(40));

        const endpoints = [
            { path: '/', name: 'Home' },
            { path: '/api/users', name: 'Users API' },
            { path: '/api/heavy', name: 'Heavy Computation' },
            { path: '/health', name: 'Health Check' }
        ];

        for (const endpoint of endpoints) {
            console.log(`\nTesting ${endpoint.name} (${endpoint.path}):`);
            
            try {
                const result = await this.makeRequest(endpoint.path);
                console.log(`✅ Status: ${result.statusCode}, Time: ${result.responseTime.toFixed(2)}ms, Server: ${result.server}`);
            } catch (error) {
                console.log(`❌ Error: ${error.error}, Time: ${error.responseTime.toFixed(2)}ms`);
            }
        }
    }

    // Stress test
    async stressTest(duration = 30000, concurrency = 10) {
        console.log(`\n⚡ Stress testing for ${duration/1000} seconds with ${concurrency} concurrent connections`);
        console.log('='.repeat(70));

        const startTime = Date.now();
        let requestCount = 0;
        const results = [];
        const activeRequests = new Set();

        const makeStressRequest = async () => {
            const requestId = ++requestCount;
            activeRequests.add(requestId);

            try {
                const result = await this.makeRequest('/');
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({ success: false, ...error });
            } finally {
                activeRequests.delete(requestId);
            }

            // Continue making requests if within duration
            if (Date.now() - startTime < duration) {
                setImmediate(makeStressRequest);
            }
        };

        // Start concurrent requests
        const initialRequests = Array(concurrency).fill().map(() => makeStressRequest());
        
        // Wait for duration
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Wait for remaining requests to complete
        while (activeRequests.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`\n📊 Stress test completed:`);
        console.log(`Total requests: ${results.length}`);
        console.log(`Successful requests: ${results.filter(r => r.success).length}`);
        console.log(`Failed requests: ${results.filter(r => !r.success).length}`);
        console.log(`Requests per second: ${(results.length / (duration / 1000)).toFixed(2)}`);

        // Analyze server distribution
        const serverStats = {};
        results.filter(r => r.success && r.server).forEach(r => {
            serverStats[r.server] = (serverStats[r.server] || 0) + 1;
        });

        console.log('\n🔄 Server distribution:');
        Object.entries(serverStats).forEach(([server, count]) => {
            const percentage = ((count / results.filter(r => r.success).length) * 100).toFixed(1);
            console.log(`  ${server}: ${count} requests (${percentage}%)`);
        });
    }

    // Process results
    processResults(results) {
        this.results.totalRequests = results.length;
        this.results.requests = [];
        this.results.servers = {};
        this.results.errors = [];

        let totalResponseTime = 0;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const data = result.value;
                this.results.successfulRequests++;
                this.results.requests.push(data);
                
                // Track server distribution
                const server = data.server || 'unknown';
                this.results.servers[server] = (this.results.servers[server] || 0) + 1;
                
                // Track response times
                totalResponseTime += data.responseTime;
                this.results.minResponseTime = Math.min(this.results.minResponseTime, data.responseTime);
                this.results.maxResponseTime = Math.max(this.results.maxResponseTime, data.responseTime);
            } else {
                this.results.failedRequests++;
                this.results.errors.push(result.reason);
            }
        });

        this.results.averageResponseTime = totalResponseTime / this.results.successfulRequests;
    }

    // Display results
    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('='.repeat(50));
        console.log(`Total Requests: ${this.results.totalRequests}`);
        console.log(`Successful: ${this.results.successfulRequests}`);
        console.log(`Failed: ${this.results.failedRequests}`);
        console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
        
        if (this.results.successfulRequests > 0) {
            console.log(`\n⏱️  Response Times:`);
            console.log(`  Average: ${this.results.averageResponseTime.toFixed(2)}ms`);
            console.log(`  Min: ${this.results.minResponseTime.toFixed(2)}ms`);
            console.log(`  Max: ${this.results.maxResponseTime.toFixed(2)}ms`);

            console.log(`\n🔄 Load Distribution:`);
            Object.entries(this.results.servers).forEach(([server, count]) => {
                const percentage = ((count / this.results.successfulRequests) * 100).toFixed(1);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`  ${server.padEnd(15)}: ${count.toString().padStart(3)} requests (${percentage.padStart(5)}%) ${bar}`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log(`\n❌ Errors:`);
            this.results.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.error || error}`);
            });
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Load Balancer Tests');
        console.log('='.repeat(50));
        
        try {
            // Test basic connectivity
            console.log('\n1. Basic connectivity test...');
            const basicTest = await this.makeRequest('/');
            console.log(`✅ Load balancer is responding: ${basicTest.server}`);

            // Test different endpoints
            await this.testEndpoints();

            // Test load distribution
            await this.testLoadDistribution(20, 5);

            // Stress test (shorter duration for demo)
            await this.stressTest(10000, 5);

        } catch (error) {
            console.error('❌ Test failed:', error);
        }

        console.log('\n✅ All tests completed!');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new LoadBalancerTester();
    tester.runAllTests().catch(console.error);
}

module.exports = LoadBalancerTester;