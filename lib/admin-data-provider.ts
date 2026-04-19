import type {
  CreateParams,
  CreateResult,
  DataProvider,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  Identifier,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from "react-admin";

import { adminApi, parseApiError } from "@/lib/admin-api";

const buildQuery = (params: GetListParams | GetManyReferenceParams): string => {
  const page = params.pagination?.page ?? 1;
  const perPage = params.pagination?.perPage ?? 25;
  const skip = (page - 1) * perPage;
  const searchParams = new URLSearchParams();

  searchParams.set("skip", String(skip));
  searchParams.set("limit", String(perPage));

  Object.entries(params.filter ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return `?${searchParams.toString()}`;
};

const getEstimatedTotal = (
  dataLength: number,
  params: GetListParams | GetManyReferenceParams
): number => {
  const page = params.pagination?.page ?? 1;
  const perPage = params.pagination?.perPage ?? 25;
  const skip = (page - 1) * perPage;

  if (dataLength < perPage) {
    return skip + dataLength;
  }

  return skip + dataLength + 1;
};

async function wrap<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}

export const adminDataProvider: DataProvider = {
  getList: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> => {
    return wrap(async () => {
      const query = buildQuery(params);
      const data = await adminApi<RecordType[]>(resource, undefined, `/${query}`.replace("/?", "?"));
      return {
        data,
        total: getEstimatedTotal(data.length, params),
      };
    });
  },

  getOne: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> => {
    return wrap(async () => {
      const data = await adminApi<RecordType>(resource, undefined, `/${params.id}`);
      return { data };
    });
  },

  getMany: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetManyParams<RecordType>
  ): Promise<GetManyResult<RecordType>> => {
    return wrap(async () => {
      const records = await Promise.all(
        params.ids.map((id) => adminApi<RecordType>(resource, undefined, `/${id}`))
      );
      return { data: records };
    });
  },

  getManyReference: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> => {
    return wrap(async () => {
      const filterWithTarget = {
        ...(params.filter ?? {}),
        [params.target]: params.id,
      };

      const query = buildQuery({ ...params, filter: filterWithTarget });
      const data = await adminApi<RecordType[]>(resource, undefined, `/${query}`.replace("/?", "?"));

      return {
        data,
        total: getEstimatedTotal(data.length, params),
      };
    });
  },

  create: async <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier }
  >(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> => {
    return wrap(async () => {
      const data = await adminApi<ResultRecordType>(
        resource,
        {
          method: "POST",
          body: JSON.stringify(params.data),
        },
        ""
      );
      return { data };
    });
  },

  update: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> => {
    return wrap(async () => {
      const data = await adminApi<RecordType>(
        resource,
        {
          method: "PATCH",
          body: JSON.stringify(params.data),
        },
        `/${params.id}`
      );
      return { data };
    });
  },

  updateMany: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> => {
    return wrap(async () => {
      const updated = await Promise.all(
        params.ids.map((id) =>
          adminApi<RecordType>(
            resource,
            {
              method: "PATCH",
              body: JSON.stringify(params.data),
            },
            `/${id}`
          )
        )
      );

      return { data: updated.map((record) => record.id) };
    });
  },

  delete: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> => {
    return wrap(async () => {
      const previousData = params.previousData;
      await adminApi<unknown>(
        resource,
        {
          method: "DELETE",
        },
        `/${params.id}`
      );
      return { data: previousData ?? ({ id: params.id } as RecordType) };
    });
  },

  deleteMany: async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> => {
    return wrap(async () => {
      await Promise.all(
        params.ids.map((id) =>
          adminApi<unknown>(
            resource,
            {
              method: "DELETE",
            },
            `/${id}`
          )
        )
      );

      return { data: params.ids };
    });
  },
};
