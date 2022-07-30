import fs from 'fs/promises';

import clientPromise from './mongodb';
/**Get all commissions for this user. */
export async function getCommissions(userId: string) {
  const client = await clientPromise;
  if (!client) return [];

  const data = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .find({
      userId: userId,
    })
    .toArray();
  return data.map((val) => {
    return {
      code: val._id,
      userId: val.userId,
      status: val.status,
      file: val.file,
      deadline: Number.parseInt(val.deadline),
      title: val.title,
      description: val.description,
      price: val.price,
      discountedPrice: val.discountedPrice ? val.discountedPrice : null,
      updates: val.updates.map((update: any) => {
        update.code = val._id;
        return update;
      }),
      createdAt: Number.parseInt(val.createdAt),
    };
  });
}

/** Change file from commission. */
export async function changeFile(code: string, path: string | null)
{
  const client = await clientPromise;
  if (!client) return [];

  const data = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .findOneAndUpdate({
      _id: code
    }, {
      $set: {
        file: path
      }
    })
}

/** Create update. */
export async function createUpdate(code: string, update: Omit<CommissionUpdate, "_id" | "id" | "code" | "read" | "timestamp">)
{
  const client = await clientPromise;
  if (!client) return null;

  const val = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .updateOne({
      _id: code,
    }, {
      $push: {
        updates: {
          title: update.title,
          description: update.description,
          attachedFile: update.attachedFile,
          newStatus: update.newStatus,
          read: false,
          timestamp: `${Sugar.Date.create("now", { setUTC: true }) as any - 0}`
        }
      },
      ...(update.newStatus && {
        $set: {
          status: update.newStatus
        }
      })
    })
}

/** Check if a commission exists. */
export async function commissionExists(code: string)
{
  const client = await clientPromise;
  if (!client) return null;

  const val = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .findOne({
      _id: code,
    })

  return val != null;
}

/**Get commission by code and user ID. If the user isn't allowed to view this commission, it will return null. */
export async function getCommission(
  code: string,
  userId: string
): Promise<Commission | null> {
  const client = await clientPromise;
  if (!client) return null;

  const val = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .findOne({
      _id: code,
      userId: userId,
    });

  return val
    ? {
        code: code,
        userId: val.userId,
        status: val.status,
        file: val.file,
        deadline: Number.parseInt(val.deadline),
        title: val.title,
        description: val.description,
        price: val.price,
        discountedPrice: val.discountedPrice ? val.discountedPrice : null,
        updates: val.updates
          .map((update: any) => {
            update.timestamp = Number.parseInt(update.timestamp);
            return update;
          })
          .sort((update1: CommissionUpdate, update2: CommissionUpdate) => {
            return update2.timestamp > update1.timestamp;
          }),
        createdAt: Number.parseInt(val.createdAt),
      }
    : null;
}

/**Get global alert. */
export async function getCurrentAlert(): Promise<string[] | null> {
  const client = await clientPromise;
  if (!client) return [];

  const data = await client
    .db(process.env.DB_NAME)
    .collection('alerts')
    .findOne();
  return data ? data.lines : null;
}

/** Remove current alert. */
export async function removeAlert() {
  const client = await clientPromise;
  if (!client) return [];

  const data = await client
    .db(process.env.DB_NAME)
    .collection('alerts')
    .deleteMany({});
}

/** Create alert. */
export async function createAlert(text: string[]) {
  const client = await clientPromise;
  if (!client) return [];

  const data = await client
    .db(process.env.DB_NAME)
    .collection('alerts')
    .insertOne({
      lines: text
    });
}

/** Edit alert. */
export async function editAlert(text: string[]) {
  const client = await clientPromise;
  if (!client) return [];

  await removeAlert();
  await createAlert(text);
}

import crypto from "crypto";
import Sugar from 'sugar';

function createId()
{
  return crypto.randomBytes(7).toString('hex').toUpperCase();
}

function flatten(arr: any[]): any[] {
  return arr.reduce(function (flat: any[], toFlatten: any[]) {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/** Returns the parsed file size for this commission. */
export async function getCommissionFileSize(
  commission: Commission
): Promise<string> {
  return formatBytes((await fs.stat(`.${commission.file}`)).size);
}

/**Get latest updates for user. */
export async function getLatestUpdates(userId: string): Promise<{
  realLength: number;
  asArray: CommissionUpdate[];
}> {
  const client = await clientPromise;
  if (!client)
    return {
      realLength: 0,
      asArray: [],
    };

  const data = flatten(
    await client
      .db(process.env.DB_NAME)
      .collection('commissions')
      .find({
        userId: userId,
        updates: {
          $not: { $size: 0 },
          $elemMatch: {
            read: false,
          },
        },
      })
      .map((val) =>
        val.updates.map((update: any, index: number) => {
          update.code = val._id;
          update.timestamp = Number.parseInt(update.timestamp);
          update.id = index;
          return update;
        })
      )
      .toArray()
  ).sort((first, second) => {
    return second.timestamp - first.timestamp;
  }).filter(update => !update.read);

  return {
    realLength: data.length,
    asArray: data.slice(0, 3),
  };
}

/** Mark as read. */
export async function markAsRead(code: string, id: number, userId: string) {
  const client = await clientPromise;
  if (!client) return;

  const result = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .updateOne(
      {
        userId: userId,
        _id: code,
      },
      {
        $set: {
          [`updates.${id}.read`]: true,
        },
      }
    );
}

/** Mark all updates as read. */
export async function markAsReadFull(code: string, userId: string) {
  const client = await clientPromise;
  if (!client) return;

  const result = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .updateOne(
      {
        userId: userId,
        _id: code,
      },
      {
        $set: {
          'updates.$[].read': true,
        },
      }
    );
}

/**Create commission. */
export async function createCommission(commission: Omit<Commission, "code" | "file" | "createdAt" | "updates" | "status">)
{
  const client = await clientPromise;
  if (!client) return null;

  const val = await client
    .db(process.env.DB_NAME)
    .collection('commissions')
    .insertOne({
      _id: createId(),
      userId: commission.userId,
      status: "not started",
      file: null,
      deadline: `${commission.deadline}`,
      title: commission.title,
      description: commission.description,
      price: commission.price,
      discountedPrice: commission.discountedPrice ? commission.discountedPrice : null,
      updates: [],
      createdAt: `${Sugar.Date.create("now", { setUTC: true }) as any - 0}`,
    } as any)
}

export const CommissionStatusArray = ["not started", "stuck", "completed"] as const;
export type CommissionStatus = (typeof CommissionStatusArray)[number];

export type CommissionUpdate = {
  _id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  code: string;
  id: number;
  newStatus?: CommissionStatus;
  attachedFile?: boolean;
};

export type Commission = {
  code: string;
  userId: string;
  status: CommissionStatus;
  file: string;
  deadline: number;
  title: string;
  description: string;
  price: string;
  discountedPrice: string | null;
  updates: CommissionUpdate[];
  createdAt: number;
};
