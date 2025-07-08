import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Alert from '@/utils/sweetAlert';
import { PageProps } from '@/types';

export default function FlashMessageHandler() {
  const { flash } = usePage<PageProps>().props;

  useEffect(() => {
    if (flash?.success) {
      Alert.success(flash.success);
    }

    if (flash?.error) {
      Alert.error(flash.error);
    }

    if (flash?.warning) {
      Alert.warning(flash.warning);
    }

    if (flash?.info) {
      Alert.info(flash.info);
    }
  }, [flash]);

  return null;
}