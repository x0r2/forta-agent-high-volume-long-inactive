'use strict'

const ONE_YEAR_IN_SECONDS = 31622400;
const ONE_ETH = 1000000000000000000; // 1 ETH
const HIGH_VOLUME = 100000000000000000000; // 100 ETH
const INACTIVE_INTERVAL = ONE_YEAR_IN_SECONDS; // 1 year

const BigNumber = require('bignumber.js');

const {
    FindingType,
    FindingSeverity,
    Finding,
    createTransactionEvent
} = require('forta-agent');

const agent = require('./agent.js');

describe('high volume inactive', () => {
    const mockEtherscan = {
        'getTxList': jest.fn()
    }

    const createTxEventWithValue = (timestamp, value) => createTransactionEvent({
        block: {
            timestamp
        },
        transaction: {
            value
        }
    });

    const handleTransaction = agent.provideHandleTransaction(mockEtherscan);

    describe('handleTransaction', () => {
        it('returns empty findings if low volume', async () => {
            const txEvent = createTxEventWithValue(0, new BigNumber(HIGH_VOLUME).minus(1));
            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns empty findings if high volume and no previous transactions', async () => {
            const txEvent = createTxEventWithValue(0, new BigNumber(HIGH_VOLUME));
            mockEtherscan.getTxList.mockReturnValueOnce([]);

            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns empty findings if high volume and short inactive interval', async () => {
            const txEvent = createTxEventWithValue(INACTIVE_INTERVAL, new BigNumber(HIGH_VOLUME));
            mockEtherscan.getTxList.mockReturnValueOnce([{}, {'timeStamp': 1}]);

            const findings = await handleTransaction(txEvent);

            expect(findings).toStrictEqual([]);
        });

        it('returns a finding if high volume and long inactive interval', async () => {
            const timestamp = INACTIVE_INTERVAL + 1;
            const timestampLast = 1;

            const value = new BigNumber(HIGH_VOLUME);
            const inactive_time = timestamp - timestampLast;

            const txEvent = createTxEventWithValue(INACTIVE_INTERVAL + 1, value);
            mockEtherscan.getTxList.mockReturnValueOnce([{}, {'timeStamp': 1}]);

            const findings = await handleTransaction(txEvent);

            const volume = value.dividedBy(ONE_ETH); // Volume in ETH
            const years = Math.floor(inactive_time / ONE_YEAR_IN_SECONDS); // Years count

            expect(findings).toStrictEqual([
                Finding.fromObject({
                    name: 'High volume after long inactive',
                    description: `High volume (${volume} ETH) after more (${years}) years inactive`,
                    alertId: 'FORTA-1',
                    severity: FindingSeverity.Critical,
                    type: FindingType.Suspicious
                })
            ]);
        });
    });
});
