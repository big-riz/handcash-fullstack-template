
import dotenv from "dotenv";
dotenv.config();
import { HandCashService } from "../lib/handcash-service";

const handcashService = new HandCashService();

async function main() {
    const targetId = "69912eda798fa5633307a932";
    console.log(`Searching for HandCash Payment Request, Template, or Campaign: ${targetId}`);

    let data: any = null;
    let type: 'request' | 'template' | 'campaign' = 'request';

    try {
        data = await handcashService.getPaymentRequest(targetId);
        type = 'request';
        console.log("Found as Payment Request.");
    } catch (err: any) {
        console.log("Not found as Payment Request, trying Template...");
        try {
            data = await handcashService.getPaymentRequestTemplate(targetId);
            type = 'template';
            console.log("Found as Payment Request Template.");
        } catch (err2: any) {
            console.log("Not found as Template, trying Campaign...");
            try {
                data = await handcashService.getCampaign(targetId);
                type = 'campaign';
                console.log("Found as Campaign.");
            } catch (err3: any) {
                console.error("Not found as Payment Request, Template, or Campaign.");
                process.exit(1);
            }
        }
    }

    console.log("Current Details:", JSON.stringify(data, null, 2));

    // Look for any time-based activation field
    const timeField = data.availableAt ? 'availableAt' : data.scheduledAt ? 'scheduledAt' : data.activationTime ? 'activationTime' : null;

    if (!timeField || !data[timeField]) {
        console.error("Could not find a time-based field (availableAt/scheduledAt/activationTime) to update.");
        process.exit(1);
    }

    const currentTime = new Date(data[timeField]);
    const newTime = new Date(currentTime.getTime() - 45 * 60 * 1000);

    console.log(`Current ${timeField}: ${currentTime.toISOString()}`);
    console.log(`New ${timeField}:     ${newTime.toISOString()} (45m earlier)`);

    const updateBody = {
        [timeField]: newTime.toISOString()
    };

    let result: any;
    try {
        if (type === 'request') {
            result = await handcashService.updatePaymentRequest(targetId, updateBody);
        } else if (type === 'template') {
            result = await handcashService.updatePaymentRequestTemplate(targetId, updateBody);
        } else {
            result = await handcashService.updateCampaign(targetId, updateBody);
        }
        console.log("Update Result:", JSON.stringify(result, null, 2));
    } catch (updateErr: any) {
        console.error("Error performing update:", updateErr.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
