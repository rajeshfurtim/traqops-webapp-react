import { useMemo} from 'react'
import { useGetAllFrequencyQuery } from '../store/api/masterSettings.api'

const useGetFreqencyList = () =>{
    const {data, isLoading,isError, error, refetch} =
    useGetAllFrequencyQuery()

    const freqencyList = useMemo(() =>{
        if(!data) return[]

        if(Array.isArray(data)) return data

        if (Array.isArray(data?.data)) return data.data

        return []
    },[data])
    return{
        freqencyList,
        isLoading,
        isError,
        error,
        refetch,
    }
}
export default useGetFreqencyList