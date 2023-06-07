const { BlobServiceClient, generateBlobSASQueryParameters, SASProtocol } = require('@azure/storage-blob');
const { ClientSecretCredential } = require('@azure/identity');

class StorageService {

    constructor() {

        this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        this.containerName = process.env.CONTAINER_NAME;

        if (!this.accountName) throw Error('Azure Storage accountName not found');
        if (!this.containerName) throw Error('Azure Storage containerName not found');

        // Get service principal identity
        const tenantId = process.env.TENANT_ID;
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;

        if (!tenantId) throw Error('Azure tenantId not found');
        if (!clientId) throw Error('Azure clientId not found');
        if (!clientSecret) throw Error('Azure clientSecret not found');

        // Create a service principal credential
        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        
        this.blobServiceClient = new BlobServiceClient(
          `https://${this.accountName}.blob.core.windows.net`,
          credential
        );        
    }

    async getSasToken(){

        try {
            // Get the user delegation key for the current time and an hour from now
            // Best practice: create time limits
            const TEN_MINUTES = 10 * 60 * 1000;
            const NOW = new Date();
            
            // Best practice: set start time a little before current time to 
            // make sure any clock issues are avoided
            const TEN_MINUTES_BEFORE_NOW = new Date(NOW.valueOf() - TEN_MINUTES);
            const TEN_MINUTES_AFTER_NOW = new Date(NOW.valueOf() + TEN_MINUTES);

            const userDelegationKey = await this.blobServiceClient.getUserDelegationKey(TEN_MINUTES_BEFORE_NOW, TEN_MINUTES_AFTER_NOW);            
            const containerName = this.containerName;            
            const sasOptions = {
                containerName,
                permissions: "rwl",
                protocol: SASProtocol.Https,
                startsOn: TEN_MINUTES_BEFORE_NOW,
                expiresOn: TEN_MINUTES_AFTER_NOW
            };
            
            const sasToken = generateBlobSASQueryParameters(sasOptions, userDelegationKey, this.accountName).toString();

            const url = `https://${this.accountName}.blob.core.windows.net/${containerName}?${sasToken}`

            return url;

        } catch (error) {
            console.error(`Error: ${error.message}`);
            return null;
        }
    }
}

module.exports = () => new StorageService();