# High Volume Long Inactive Agent

## Description

This agent detects transactions with high volume and long inactive addresses

## Supported Chains

- Ethereum

## Alerts

- FORTA-1
  - Fired when a transaction volume more than 100 ETH and address wasn't active more than 1 year
  - Severity is always "critical"
  - Type is always "suspicious"
  
## Settings

This agent need Etherscan API key for work. Create your API key and put it into forta.config.json:

```"etherscanApiKey": "API_KEY"```
