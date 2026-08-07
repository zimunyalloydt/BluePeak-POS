using System.ComponentModel.DataAnnotations;

namespace bluepeak_api.DTOs.Products;

public class UpdateProductDto
{
    [Required]
    public string ProductName { get; set; } = string.Empty;

    public string? Barcode { get; set; }

    public decimal SellingPrice { get; set; }

    public decimal CostPrice { get; set; }

    public int QuantityInStock { get; set; }

    public bool IsActive { get; set; }

  

    public string? ImageUrl { get; set; }

    public IFormFile? Image { get; set; }
}