// For help writing plugins, visit the documentation to get started:
//   https://docs.insomnia.rest/insomnia/introduction-to-plugins

const bufferToJsonObj = buf => JSON.parse(buf.toString('utf-8'));
const jsonObjToBuffer = obj => Buffer.from(JSON.stringify(obj), 'utf-8');

/**
 * Recursively iterates on every object property and checks if property name is "payload".
 * If true, then function applies given callback on its value.
 * @param obj the object to walk across
 * @param propertiesNames the properties names to apply callback to
 * @param callback the callback to apply on selected properties
 */
const eachRecursive = (obj, propertiesNames, callback) => {
    for (var k in obj) {
        if (typeof obj[k] == "object" && obj[k] !== null) {
            eachRecursive(obj[k], propertiesNames, callback);
        }
        else {
            if (propertiesNames.includes(k)) {
                obj[k] = callback.apply(this, [obj[k]]);
            }
        }
    }
}

module.exports.requestHooks = [
    context => {
        console.log(context.request.getBody());
        const body = JSON.parse(context.request.getBody().text);
        eachRecursive(body, ['payload'], o => Buffer.from(o, 'utf8').toString('base64'));
        console.log(body);
        context.request.setBody({
            ...body,
            text: JSON.stringify(body),
        });
    }
];

module.exports.responseHooks = [
    async ctx => {
        try {
            const response = bufferToJsonObj(ctx.response.getBody());
            eachRecursive(response, ['payload'], o => Buffer.from(o, 'base64').toString('utf8'));
            ctx.response.setBody(jsonObjToBuffer(response));
        } catch {
            console.error("Could not decode fields from response");
        }
    }
]
