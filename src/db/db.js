import Dexie from 'dexie';

export const db = new Dexie('LabelPrintAppDB');

db.version(1).stores({
    printerGroups: '++id, name', // Primary key and indexed props
    appSettings: 'key' // For storing simple key-value pairs like 'lastActiveGroupId'
});

// Helper to get the initial/default group if none exists
export const initializeDB = async () => {
    const count = await db.printerGroups.count();
    if (count === 0) {
        await db.printerGroups.add({
            name: 'Default Location',
            permanentPrinter: {
                name: '',
                width: 50,
                height: 30,
                orientation: 'portrait'
            },
            nonPermanentPrinter: {
                name: '',
                width: 50,
                height: 30,
                orientation: 'portrait'
            }
        });
    }
};
