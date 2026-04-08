
import {
  View,
  Text,
  Image
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../../../../services/S3Service";

export const ProductCard = ({ product }) => {
  const imgUrl = useQuery({ queryKey: ['Product', 'GET', "productImage", product.id], queryFn: () => getS3Image(product.image_path) })
  const containerSideSize = 350;

  return (
    <View style={{
      margin: 5,
      minWidth: containerSideSize,
      minHeight: containerSideSize,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      shadowOpacity: 0.2,
      shadowOffset: {
        width: 0, height: 0
      }
    }}
    >
      <View style={{
        width: '100%',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center'
      }}>
        <View style={{ width: '100%' }}>
          {
            imgUrl.data ?
              <Image source={{ uri: imgUrl.data }} style={{
                width: "100%",
                resizeMode: "contain",
                height: 200,
                marginBottom: 20,
                alignSelf: 'center',
              }} />
              : <View style={{ width: '100%', height: 100, backgroundColor: '#fff' }} />
          }
          <View style={{ position: 'absolute', right: 0, bottom: 5 }}>
            {
              product.more?.split(";").map((value, index) => {
                return <View
                  key={index}
                  style={{
                    backgroundColor: '#33C0B7',
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingVertical: 5,
                    marginVertical: 5,
                    alignSelf: 'flex-end',
                    opacity: 0.9
                  }}>
                  <Text key={index} style={{ color: "#fff", fontSize: 10, fontFamily: 'Poppins-Medium' }}>{value}</Text>
                </View>
              })
            }
          </View>
        </View>
        <Text style={{ fontSize: 14, fontFamily: 'Roboto', width: '80%', textAlign: 'left' }}>{product.type}</Text>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', width: '80%', textAlign: 'left' }}>{product.model}</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', width: '80%', textAlign: 'left' }}>{product.option} <Text style={{ color: '#33C0B7' }}>{product.brand}</Text></Text>
      </View>
    </View>
  );
}
