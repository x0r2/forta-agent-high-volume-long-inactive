'use strict';

const HIGH_VOLUME = 100000000000000000000; // 100 ETH
const INACTIVE_INTERVAL = 31622400; // 1 year

const BigNumber = require('bignumber.js');

const {
    Finding,
    FindingSeverity,
    FindingType,
    createTransactionEvent
} = require('forta-agent');

const agent = require('./agent.js');

describe('high volume long inactive', () => {
    const mockEtherscanProvider = {
        'getHistoryDesc': jest.fn()
    }

    const createTxEventWithValue = (from, value, timestamp) => createTransactionEvent({
        block: {
            timestamp
        },
        transaction: {
            from,
            value
        }
    });

    const handleTransaction = agent.provideHandleTransaction(mockEtherscanProvider);

    describe('handleTransaction', () => {
        it('returns empty findings if low volume', async () => {
            const txEvent = createTxEventWithValue('0x00', new BigNumber(HIGH_VOLUME).minus(1), 0);
            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns empty findings if high volume and no previous transactions', async () => {
            const txEvent = createTxEventWithValue('0x00', new BigNumber(HIGH_VOLUME), 0);
            mockEtherscanProvider.getHistoryDesc.mockReturnValueOnce(Promise.resolve([]));

            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns empty findings if high volume and short inactive interval', async () => {
            const txEvent = createTxEventWithValue('0x00', new BigNumber(HIGH_VOLUME), INACTIVE_INTERVAL);
            mockEtherscanProvider.getHistoryDesc.mockReturnValueOnce(Promise.resolve([{}, {'timestamp': 1}]));

            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns a finding if high volume and long inactive interval', async () => {
            const from = '0x00';
            const value = new BigNumber(HIGH_VOLUME);
            const timestamp = INACTIVE_INTERVAL + 1;
            const timestampPrev = 1;

            const txEvent = createTxEventWithValue(from, value, timestamp);
            mockEtherscanProvider.getHistoryDesc.mockReturnValueOnce(Promise.resolve([{}, {'timestamp': timestampPrev}]));

            const findings = await handleTransaction(txEvent);

            const inactiveTime = timestamp - timestampPrev;

            const printableVolume = value.dividedBy(1000000000000000000); // 1 ETH
            const printableDays = Math.floor(inactiveTime / 86400); // 1 day in seconds

            expect(findings).toStrictEqual([
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
            ]);
        });
    });
});
