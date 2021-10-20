'use strict'

const ONE_YEAR_IN_SECONDS = 31622400;
const ONE_ETH = 1000000000000000000; // 1 ETH
const HIGH_VOLUME = 100000000000000000000; // 100 ETH
const INACTIVE_INTERVAL = ONE_YEAR_IN_SECONDS; // 1 year

const BigNumber = require('bignumber.js');
const Etherscan = require('etherscan');

const {
    Finding,
    FindingSeverity,
    FindingType,
    getFortaConfig
} = require('forta-agent');

const etherscanApiKey = getFortaConfig().etherscanApiKey;
const etherscan = new Etherscan(etherscanApiKey);

function provideHandleTransaction(etherscan) {
    return async function (txEvent) {
        const findings = [];

        const from = txEvent.transaction.from;
        const value = new BigNumber(txEvent.transaction.value);

        // Pass low volume
        if (value.isLessThan(HIGH_VOLUME)) {
            return findings;
        }

        const timestampLast = await getLastTxTimestamp(from);

        // Pass empty timestamp
        if (!timestampLast) {
            return findings;
        }

        const timestamp = txEvent.block.timestamp;
        const inactive_time = timestamp - timestampLast;

        // Pass short inactive time
        if (inactive_time < INACTIVE_INTERVAL) {
            return findings;
        }

        const volume = value.dividedBy(ONE_ETH); // Volume in ETH
        const years = Math.floor(inactive_time / ONE_YEAR_IN_SECONDS); // Years count

        findings.push(
            Finding.fromObject({
                name: 'High volume after long inactive',
                description: `High volume (${volume} ETH) after more (${years}) years inactive`,
                alertId: 'FORTA-1',
                severity: FindingSeverity.Critical,
                type: FindingType.Suspicious
            })
        );

        return findings;
    };

    async function getLastTxTimestamp(address) {
        const txs = await etherscan.getTxList({
            address,
            'sort': 'desc'
        });

        if (txs.length < 2) {
            return;
        }

        return Number(txs[1].timeStamp);
    }
}

module.exports = {
    provideHandleTransaction,
    handleTransaction: provideHandleTransaction(etherscan)
};
