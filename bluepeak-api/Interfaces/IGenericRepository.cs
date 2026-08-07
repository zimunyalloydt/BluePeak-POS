using System.Linq.Expressions;

namespace bluepeak_api.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<IEnumerable<T>> GetAllAsync();

    Task<T?> GetByIdAsync(int id);

    Task<T?> FindAsync(Expression<Func<T, bool>> predicate);

    Task<IEnumerable<T>> FindAllAsync(Expression<Func<T, bool>> predicate);

    Task AddAsync(T entity);

    void Update(T entity);

    void Delete(T entity);

    Task SaveChangesAsync();
}