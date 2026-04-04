import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Error: ${error.message}`);

    // Common cause: DNS SRV lookup failure for `mongodb+srv` URIs (querySrv ENOTFOUND).
    // If an alternate (non-SRV) connection string is provided in MONGODB_URI_ALT,
    // try it before giving up. This allows environments without SRV DNS support
    // to supply the explicit `mongodb://host1,host2/...` URI returned by Atlas.
    if (
      (error.code === 'ENOTFOUND' || String(error.message).includes('querySrv')) &&
      process.env.MONGODB_URI_ALT
    ) {
      try {
        const altConn = await mongoose.connect(process.env.MONGODB_URI_ALT, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected (ALT): ${altConn.connection.host}`);
        return true;
      } catch (altErr) {
        console.error('⚠️ Fallback MongoDB (MONGODB_URI_ALT) failed:', altErr.message);
      }
    }

    console.log('Server will continue running. Database operations will fail.');
    // Prevent Mongoose from buffering commands for the default timeout
    // so errors are thrown immediately instead of waiting ~10000ms.
    try {
      mongoose.set('bufferCommands', false);
    } catch (e) {
      // ignore
    }
    return false;
  }
};

export default connectDB;

/**
 * Ensure mongoose is connected. If not connected, attempt to connect.
 * Throws if unable to connect within the configured timeouts.
 */
export const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 1) return;

  // If buffering is disabled, we must actively connect before issuing queries
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    return;
  } catch (err) {
    // If SRV/DNS failed and an alternate URI is supplied, try it
    if ((err.code === 'ENOTFOUND' || String(err.message).includes('querySrv')) && process.env.MONGODB_URI_ALT) {
      await mongoose.connect(process.env.MONGODB_URI_ALT, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      });
      return;
    }

    // Re-throw so callers can handle and return a 503/meaningful response
    throw err;
  }
};

