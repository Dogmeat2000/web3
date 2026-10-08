import { MongoClient, ObjectId } from 'mongodb';
//import { sellSingleBookToCustomer } from '../operations/sellSingleBookToCustomer.js';

const connectionString = 'mongodb+srv://ViaStudent344849:V1a_344849_Stud3nt@mycluster.bk1bieo.mongodb.net/'
let client = undefined

function mongoClient() {
    if (!client) {
        client = new MongoClient(connectionString)
        client.connect()
    }
    return client
}

async function runSession(callback) {
    const client = mongoClient();
    const session = client.startSession()
    session.startTransaction();
    try {
        const db = client.db('amazonBookstore')

        const result = await callback(db, session);
        await session.commitTransaction();
        return result;
    } catch (e) {
        console.error("TRANSACTION ABORTED:", e.message);
        await session.abortTransaction();
        console.log(e.stack)
        throw e
    } finally {
        await session.endSession()
    }
}


// --- Query Resolvers ---
export const searchBooks = (_, { searchTerm }) =>
    runSession(async (db) => {
        const books = await db.collection('books')
            .find({ title: { $regex: searchTerm, $options: 'i' } }).toArray();
        return books.map(b => ({ ...b, id: b._id.toString() }));
    });

export const customerOrders = (_, { email }) =>
    runSession(async (db) => {
        const orders = await db.collection('orders')
            .find({ "customerDetails.email": email })
            .toArray();

        return orders.map(o => ({
            id: o._id.toString(),
            orderDate: o.creationTime.toISOString(),
            customerEmail: o.customerDetails.email,
            totalPrice: o.orderTotal,
            bookCount: o.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            orderItems: o.orderItems.map(item => ({
                bookId: item.bookListing.listingId.toString(),
                bookTitle: item.bookListing.bookFormatDetails.book.title,
                priceAtPurchase: item.itemPriceInOrderCurrency
            }))
        }));
    });


// --- Order Field Resolvers ---
export const orderFields = {
    totalPrice: (parent) => parent.orderItems.reduce((acc, i) => acc + i.priceAtPurchase, 0),
    bookCount: (parent) => parent.orderItems.length
};


// --- Mutation Resolvers ---
export const createOneClickOrder = (_, { customerId, listingId, shippingAddress }) =>
    runSession(async (db, session) => {
        const listing = await db.collection('booklistings').findOne({ _id: new ObjectId(listingId) });
        const customer = await db.collection('customeraccounts').findOne({ _id: new ObjectId(customerId) });

        if (!listing || !customer) throw new Error("Assets not found (Listing or Customer)");
        if (listing.quantity < 1) throw new Error("Item out of stock");

        const order = await sellSingleBookToCustomer(
            db,
            session,
            { firstname: customer.firstName, lastname: customer.lastName },
            {
                bookTitle: listing.bookFormatDetails.book.title,
                bookFormat: listing.bookFormatDetails.physicalBook.physicalFormat,
                quantity: 1
            },
            {
                currencyName: customer.defaultCurrency || "GBP",
                currencySymbol: "£"
            },
            shippingAddress,
            1.50,
            2.99
        );

        return {
            ...order,
            id: order._id,
            orderDate: order.creationTime,
            customerEmail: order.customerDetails.email,
            bookCount: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            orderItems: order.orderItems.map(item => ({
                bookId: item.bookListing.listingId.toString(),
                bookTitle: item.bookListing.bookFormatDetails.book.title,
                priceAtPurchase: item.itemPriceInOrderCurrency
            }))
        }
    });

export const applyPriceReduction = (_, { listingId, percentage }) =>
    runSession(async (db, session) => {
        const factor = 1 - (percentage / 100);
        const objectId = new ObjectId(listingId);
        const originalListing = await db.collection('booklistings').findOne({ _id: objectId }, { session });
        if (!originalListing) throw new Error("Listing not found");
        const updatedListing = await db.collection('booklistings').findOneAndUpdate({ _id: objectId }, { $mul: { listingPrice: factor } }, { returnDocument: 'after', session });
        return {
            id: updatedListing._id.toString(),
            beforePrice: originalListing.listingPrice,
            afterPrice: updatedListing.listingPrice,
            currency: updatedListing.listingCurrency.currencySymbol,
            quantity: updatedListing.quantity,
            title: updatedListing.bookFormatDetails.book.title,
            format: updatedListing.bookFormatDetails.physicalBook?.physicalFormat || updatedListing.bookFormatDetails.digitalBook?.digitalFormat || "Unknown Format"
        };
    });