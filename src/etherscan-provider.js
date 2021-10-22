'use strict';

const ethers = require('ethers');

class EtherscanProvider {
    async getHistory(addressOrName, startBlock, endBlock) {
        const params = {
            action: "txlist",
            address: (await this.resolveName(addressOrName)),
            startblock: ((startBlock == null) ? 0: startBlock),
            endblock: ((endBlock == null) ? 99999999: endBlock),
            sort: "desc"
        };

        const result = await this.fetch("account", params);

        return result.map((tx) => {
            ["contractAddress", "to"].forEach(function(key) {
                if (tx[key] == "") { delete tx[key]; }
            });
            if (tx.creates == null && tx.contractAddress != null) {
                tx.creates = tx.contractAddress;
            }
            const item = this.formatter.transactionResponse(tx);
            if (tx.timeStamp) { item.timestamp = parseInt(tx.timeStamp); }
            return item;
        });
    }
}
