# Cloudflare Setup for caiatech.com

## Prerequisites
- Domain registered and added to Cloudflare
- GKE deployment completed with external IP address
- Cloudflare account with access to caiatech.com

## Step 1: Deploy to GKE

First, set your environment variables and run the deployment:

```bash
# Set your GCP configuration
export PROJECT_ID=your-gcp-project-id
export CLUSTER_NAME=your-gke-cluster-name
export CLUSTER_ZONE=your-gke-cluster-zone

# Run the deployment script
./deploy-to-gke.sh
```

## Step 2: Get the Ingress External IP

After deployment, get your ingress external IP:

```bash
kubectl get ingress caiatech-website-ingress
```

Wait for the EXTERNAL-IP to be assigned (it may take a few minutes).

## Step 3: Configure Cloudflare DNS

1. Log in to Cloudflare Dashboard
2. Select the caiatech.com domain
3. Go to DNS settings
4. Add the following records:

### A Records
| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | YOUR_INGRESS_IP | Proxied | Auto |
| A | www | YOUR_INGRESS_IP | Proxied | Auto |

### Optional: Additional Subdomains
| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | api | caiatech.com | Proxied | Auto |
| CNAME | app | caiatech.com | Proxied | Auto |

## Step 4: Configure SSL/TLS

1. Go to SSL/TLS settings in Cloudflare
2. Set encryption mode to **Full (strict)**
3. Enable the following options:
   - Always Use HTTPS
   - Automatic HTTPS Rewrites
   - Opportunistic Encryption
   - TLS 1.3

## Step 5: Configure Page Rules (Optional)

Create page rules for better caching:

1. Go to Rules > Page Rules
2. Create a new rule:
   - URL: `*caiatech.com/*`
   - Settings:
     - Browser Cache TTL: 1 hour
     - Cache Level: Standard
     - Edge Cache TTL: 2 hours

## Step 6: Configure Security Settings

1. Go to Security settings
2. Set Security Level to "Medium"
3. Enable Bot Fight Mode
4. Configure WAF rules as needed

## Step 7: Performance Optimization

1. Go to Speed > Optimization
2. Enable:
   - Auto Minify (JavaScript, CSS, HTML)
   - Brotli compression
   - Early Hints
   - Rocket Loader (optional)

## Verification

After setup, verify everything is working:

```bash
# Check DNS propagation
dig caiatech.com
dig www.caiatech.com

# Test HTTPS
curl -I https://caiatech.com
curl -I https://www.caiatech.com

# Check certificate
openssl s_client -connect caiatech.com:443 -servername caiatech.com
```

## Troubleshooting

### DNS not resolving
- Wait 5-10 minutes for propagation
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)

### SSL errors
- Ensure SSL/TLS mode is set to "Full (strict)"
- Wait for Let's Encrypt certificate to be issued in GKE
- Check ingress annotations for cert-manager

### 5xx errors
- Check pod logs: `kubectl logs -l app=caiatech-website`
- Verify service is running: `kubectl get pods`
- Check ingress status: `kubectl describe ingress caiatech-website-ingress`

## Monitoring

Set up monitoring in Cloudflare:
1. Go to Analytics
2. Monitor:
   - Traffic patterns
   - Cache hit ratio
   - Error rates
   - Performance metrics

## Additional Configuration

### Email Records (if needed)
| Type | Name | Content | Priority | TTL |
|------|------|---------|----------|-----|
| MX | @ | mail.provider.com | 10 | Auto |
| TXT | @ | "v=spf1 include:provider.com ~all" | - | Auto |

### Development/Staging
| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | dev | YOUR_DEV_IP | DNS only | Auto |
| A | staging | YOUR_STAGING_IP | Proxied | Auto |