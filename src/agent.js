'use strict';

const HIGH_VOLUME = 100000000000000000000; // 100 ETH
const INACTIVE_INTERVAL = 31622400; // 1 year

const BigNumber = require('bignumber.js');
const EtherscanProvider = require('./etherscan-provider.js');

const {
    Finding,
    FindingSeverity,
    FindingType
} = require('forta-agent');

const etherscanProvider = new EtherscanProvider();

function provideHandleTransaction(etherscanProvider) {
    return async (txEvent) => {
        const findings = [];

        const value = new BigNumber(txEvent.transaction.value);

        // Skip low volume
        if (value.isLessThan(HIGH_VOLUME)) {
            return findings;
        }

        const from = txEvent.transaction.from;
        const timestampPrev = await getTimestampPrev(from);

        // Skip empty timestamp
        if (!timestampPrev) {
            return findings;
        }

        const timestamp = txEvent.block.timestamp;
        const inactiveTime = timestamp - timestampPrev;

        // Skip short inactive time
        if (inactiveTime < INACTIVE_INTERVAL) {
            return findings;
        }

        const printableVolume = value.dividedBy(1000000000000000000);
        const printableDays = Math.floor(inactiveTime / 86400);

        findings.push(
            Finding.fromObject({
                name: 'High Volume Long Inactive',
                description: `High volume (${printableVolume} ETH) after (${printableDays}) days inactive`,
                alertId: 'HIGH-VOLUME-LONG-INACTIVE-1',
                severity: FindingSeverity.Critical,
                type: FindingType.Suspicious,
                metadata: {
                    from,
                    value,
                    inactiveTime
                }
            })
        );

        return findings;
    };

    async function getTimestampPrev(address) {
        const transactions = await etherscanProvider.getHistoryDesc(address).catch(() => {
            return etherscanProvider.getHistoryDesc(address).catch(() => {
                return [];
            });
        });

        if (transactions.length < 2) {
            return;
        }

        return transactions[1].timestamp;
    }
}

module.exports = {
    provideHandleTransaction,
    handleTransaction: provideHandleTransaction(etherscanProvider)
};
