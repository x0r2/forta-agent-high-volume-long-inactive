Please add me as a Agent Developer [Published] on Discord, my username is alte#8910

# High Volume Long Inactive Agent

## Description

This agent detects transactions with high volume and long inactive addresses

## Supported Chains

- Ethereum

## Alerts

- HIGH-VOLUME-LONG-INACTIVE-1
    - Fired when a transaction volume more than 100 ETH and address wasn't active more than 1 year
    - Severity is always "critical"
    - Type is always "suspicious"
    - Metadata fields:
        - "from" - the address which is sending a high volume and was long inactive
        - "value" - volume in wei
        - "inactiveTime" - inactive time in seconds
