using bluepeak_api.DTOs.Refunds;

namespace bluepeak_api.Interfaces;

public interface IRefundService
{
    Task CreateRequestAsync(
        int userId,
        CreateRefundRequestDto dto
    );

    Task<List<RefundRequestDto>> GetPendingAsync();

    Task ApproveAsync(
        int refundId,
        int adminUserId
    );

    Task RejectAsync(
        int refundId,
        int adminUserId
    );
}