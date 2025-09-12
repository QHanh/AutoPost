import Swal from 'sweetalert2';

interface RestoreAllDeletedModalConfig {
  itemType: 'devices' | 'services' | 'components';
  getDeletedItems: () => Promise<any[]>;
  restoreAllItems: () => Promise<any>;
  onSuccess: () => void;
  formatPrice?: (price: string | number) => string;
}

export const useRestoreAllDeletedModal = ({
  itemType,
  getDeletedItems,
  restoreAllItems,
  onSuccess,
  formatPrice = (price) => price?.toString() || ''
}: RestoreAllDeletedModalConfig) => {
  
  const getItemTypeText = () => {
    if (itemType === 'devices') return 'thiết bị';
    if (itemType === 'components') return 'linh kiện';
    return 'dịch vụ';
  };

  const generateItemTable = (items: any[], itemType: string, formatPrice?: (price: string | number) => string) => {
  if (itemType === 'devices' || itemType === 'components') {
    return `
      <div style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">${itemType === 'components' ? 'Tên linh kiện' : 'Tên thiết bị'}</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Thương hiệu</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Loại</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px; border: 1px solid #dee2e6;">${itemType === 'components' ? (item.product_name || 'N/A') : (item.device_info?.model || item.name || 'N/A')}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${itemType === 'components' ? (item.trademark || 'N/A') : (item.device_info?.brand || item.device_brand?.name || 'N/A')}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${itemType === 'components' ? (item.category || 'N/A') : (item.device_type || item.device_info?.type || 'N/A')}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${formatPrice ? formatPrice(item.amount ?? item.price) : (item.amount ?? item.price)} đ</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (itemType === 'services') {
    // For services with brands
    return `
      <div style="max-height: 500px; overflow-y: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Tên dịch vụ</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Thương hiệu liên kết</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Mã DV</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Loại thiết bị</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((service: any) => {
              if (service.brands && service.brands.length > 0) {
                return service.brands.map((brand: any, index: number) => `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px; border: 1px solid #dee2e6; ${index === 0 ? 'font-weight: bold; background-color: #f8f9fa;' : ''}">
                      ${index === 0 ? `${service.name}` : ''}
                      ${index === 0 && (service.description || (service.conditions && service.conditions.length > 0)) ? `
                        <div style='font-weight: normal; font-size: 12px; color: #6b7280; margin-top: 4px;'>
                          ${service.description ? `<div>Mô tả: ${service.description}</div>` : ''}
                          ${(service.conditions && service.conditions.length > 0) ? `<div>Điều kiện: ${service.conditions.join(', ')}</div>` : ''}
                        </div>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${brand.name || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${brand.service_code || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${brand.device_brand?.name || 'N/A'}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${formatPrice ? formatPrice(brand.price) : brand.price} đ</td>
                  </tr>
                `).join('');
              } else {
                return `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold; background-color: #f8f9fa;">
                      ${service.name}
                      ${(service.description || (service.conditions && service.conditions.length > 0)) ? `
                        <div style='font-weight: normal; font-size: 12px; color: #6b7280; margin-top: 4px;'>
                          ${service.description ? `<div>Mô tả: ${service.description}</div>` : ''}
                          ${(service.conditions && service.conditions.length > 0) ? `<div>Điều kiện: ${service.conditions.join(', ')}</div>` : ''}
                        </div>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;" colspan="4"><em>Không có thương hiệu liên kết</em></td>
                  </tr>
                `;
              }
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // For brands only
    return `
      <div style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Mã DV</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Tên dịch vụ</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Loại sản phẩm</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Thương hiệu</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.service_code || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.service?.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.device_brand?.name || 'N/A'}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${formatPrice ? formatPrice(item.price) : item.price} đ</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

  const handleRestoreAll = async () => {
    try {
      const response = await getDeletedItems();
      const deletedItems = Array.isArray(response) ? response : (response as any).data || [];
      
      if (deletedItems.length === 0) {
        Swal.fire({
          title: 'Thông báo',
          text: `Không có ${itemType === 'devices' ? 'thiết bị' : itemType === 'services' ? 'dịch vụ' : 'thương hiệu'} nào bị xóa trong ngày hôm nay.`,
          icon: 'info'
        });
        return;
      }

      // Tạo HTML table hiển thị danh sách items đã xóa
      const itemListHtml = generateItemTable(deletedItems, itemType, formatPrice);

      let totalItemsCount = deletedItems.length;
      if (itemType === 'services') {
        const totalBrands = deletedItems.reduce((sum: number, service: any) => sum + (service.brands?.length || 0), 0);
        totalItemsCount = deletedItems.length + totalBrands;
      }

      const result = await Swal.fire({
        title: `Khôi phục ${itemType === 'services' ? `${deletedItems.length} dịch vụ và các thương hiệu liên kết` : `${deletedItems.length} ${itemType === 'devices' ? 'thiết bị' : 'thương hiệu'}`}?`,
        html: `
          <p>Bạn có chắc chắn muốn khôi phục tất cả ${itemType === 'devices' ? 'thiết bị' : itemType === 'services' ? 'dịch vụ và thương hiệu liên kết' : 'thương hiệu'} đã xóa trong ngày hôm nay không?</p>
          ${itemListHtml}
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Khôi phục tất cả',
        cancelButtonText: 'Hủy',
        width: '90%',
        customClass: {
          popup: 'swal-wide'
        }
      });

      if (result.isConfirmed) {
        try {
          await restoreAllItems();
          
          Swal.fire({
            title: 'Thành công!',
            text: `Đã khôi phục ${itemType === 'services' ? `${deletedItems.length} dịch vụ và các thương hiệu liên kết` : `${deletedItems.length} ${itemType === 'devices' ? 'thiết bị' : 'thương hiệu'}`} thành công.`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });

          onSuccess?.();
        } catch (error) {
          console.error('Error restoring all items:', error);
          Swal.fire({
            title: 'Lỗi!',
            text: `Khôi phục ${itemType === 'devices' ? 'thiết bị' : itemType === 'services' ? 'dịch vụ' : 'thương hiệu'} không thành công.`,
            icon: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error getting deleted items:', error);
      Swal.fire({
        title: 'Lỗi!',
        text: `Không thể lấy danh sách ${itemType === 'devices' ? 'thiết bị' : itemType === 'services' ? 'dịch vụ' : 'thương hiệu'} đã xóa.`,
        icon: 'error'
      });
    }
  };

  return { handleRestoreAll };
};
